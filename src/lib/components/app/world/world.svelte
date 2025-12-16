<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import 'pathseg';
	import Matter from 'matter-js';
	import type { Terrain, PlayerCharacter, PlayerBuilding } from '$lib/types';
	import { getGameAssetUrl } from '$lib/utils/storage';
	import { useServerPayload } from '$lib/hooks/use-server-payload.svelte';

	import { VIEW_BOX_WIDTH, VIEW_BOX_HEIGHT } from './constants';
	import WorldCharacter from './world-character.svelte';
	import WorldBuilding from './world-building.svelte';
	import { atlases } from '$lib/components/app/sprite-animator';

	const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Svg, Vertices } =
		Matter;

	interface Props {
		terrain?: Terrain;
		characters?: PlayerCharacter[];
		buildings?: PlayerBuilding[];
		debug?: boolean;
		children?: Snippet;
	}

	let { terrain, characters = [], buildings = [], debug = false, children }: Props = $props();

	const { supabase } = useServerPayload();

	let container: HTMLDivElement;
	let engine: Matter.Engine;
	let render: Matter.Render;
	let runner: Matter.Runner;
	let canvasWidth = $state(VIEW_BOX_WIDTH);
	let canvasHeight = $state(VIEW_BOX_HEIGHT);

	// 캐릭터 바디 관리 (Matter.js 객체는 $state.raw로 Proxy 방지)
	let characterBodies = $state.raw<Record<string, Matter.Body>>({});
	let characterBodySizes = $state.raw<Record<string, { width: number; height: number }>>({});
	let characterPositions = $state<Record<string, { x: number; y: number; angle: number }>>({});

	// 건물 바디 관리
	let buildingBodies = $state.raw<Record<string, Matter.Body>>({});
	let buildingBodySizes = $state.raw<Record<string, { width: number; height: number }>>({});
	let buildingPositions = $state<Record<string, { x: number; y: number; angle: number }>>({});

	let mounted = false;

	const CHARACTER_RESOLUTION = 2; // 캐릭터 스프라이트 해상도
	const BUILDING_RESOLUTION = 2; // 건물 스프라이트 해상도
	const DEFAULT_CHARACTER_SIZE = 32; // 아틀라스 없을 때 기본 크기
	const DEFAULT_BUILDING_SIZE = 64; // 건물 기본 크기
	const WALL_THICKNESS = 1;

	// 충돌 카테고리 (비트마스크)
	const CATEGORY_WALL = 0x0001;
	const CATEGORY_TERRAIN = 0x0002;
	const CATEGORY_CHARACTER = 0x0004;
	const CATEGORY_BUILDING = 0x0008;

	// 디버그 모드일 때만 보이는 스타일
	const debugBodyStyle = {
		fillStyle: 'rgba(255, 0, 0, 0.5)',
	};

	const hiddenBodyStyle = {
		visible: false,
	};

	const wallStyle = $derived(debug ? debugBodyStyle : hiddenBodyStyle);

	// SVG URL
	const svgUrl = $derived(terrain ? getGameAssetUrl(supabase, 'terrain', terrain) : undefined);

	// viewBox 좌표를 실제 캔버스 좌표로 변환
	function scaleX(x: number): number {
		return (x / VIEW_BOX_WIDTH) * canvasWidth;
	}

	function scaleY(y: number): number {
		return (y / VIEW_BOX_HEIGHT) * canvasHeight;
	}

	interface PathStyle {
		fill: string | null;
		stroke: string | null;
		strokeWidth: number;
	}

	function getPathStyle(path: SVGPathElement): PathStyle {
		const style = path.getAttribute('style') || '';

		const fillMatch = style.match(/fill\s*:\s*([^;]+)/);
		const strokeMatch = style.match(/stroke\s*:\s*([^;]+)/);
		const strokeWidthMatch = style.match(/stroke-width\s*:\s*([^;]+)/);

		const fillValue = fillMatch?.[1]?.trim() || path.getAttribute('fill');
		const strokeValue = strokeMatch?.[1]?.trim() || path.getAttribute('stroke');
		const strokeWidthStr =
			strokeWidthMatch?.[1]?.trim() || path.getAttribute('stroke-width') || '1';

		return {
			fill: fillValue === 'none' ? null : fillValue,
			stroke: strokeValue === 'none' ? null : strokeValue,
			strokeWidth: parseFloat(strokeWidthStr) || 1,
		};
	}

	function getBodyRenderStyle(): Matter.IBodyRenderOptions {
		return debug ? debugBodyStyle : hiddenBodyStyle;
	}

	function createLineBody(
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		width: number
	): Matter.Body {
		const sx1 = scaleX(x1);
		const sy1 = scaleY(y1);
		const sx2 = scaleX(x2);
		const sy2 = scaleY(y2);

		const cx = (sx1 + sx2) / 2;
		const cy = (sy1 + sy2) / 2;
		const dx = sx2 - sx1;
		const dy = sy2 - sy1;
		const length = Math.sqrt(dx * dx + dy * dy);
		const angle = Math.atan2(dy, dx);

		return Bodies.rectangle(cx, cy, length, width, {
			isStatic: true,
			angle,
			collisionFilter: {
				category: CATEGORY_TERRAIN,
				mask: CATEGORY_CHARACTER | CATEGORY_BUILDING, // 캐릭터, 건물과 충돌
			},
			render: getBodyRenderStyle(),
		});
	}

	function createFilledBody(vertices: Matter.Vector[]): Matter.Body | undefined {
		if (vertices.length < 3) return;

		// 스케일 적용
		const scaledVertices = vertices.map((v) => ({
			x: scaleX(v.x),
			y: scaleY(v.y),
		}));

		const center = Vertices.centre(scaledVertices);
		const body = Bodies.fromVertices(center.x, center.y, [scaledVertices], {
			isStatic: true,
			collisionFilter: {
				category: CATEGORY_TERRAIN,
				mask: CATEGORY_CHARACTER | CATEGORY_BUILDING, // 캐릭터, 건물과 충돌
			},
			render: getBodyRenderStyle(),
		});

		return body;
	}

	async function loadTerrainSvg(terrain: Terrain): Promise<Matter.Body[]> {
		const url = getGameAssetUrl(supabase, 'terrain', terrain);
		if (!url) return [];

		try {
			const response = await fetch(url);
			const svgText = await response.text();

			const parser = new DOMParser();
			const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
			const paths = svgDoc.querySelectorAll('path');

			const bodies: Matter.Body[] = [];

			paths.forEach((path) => {
				const pathStyle = getPathStyle(path);
				const vertices = Svg.pathToVertices(path, 15);

				// fill과 stroke 둘 다 있으면: fill은 다각형, stroke는 선
				// fill만 있으면: 선으로 처리 (벡터 브러쉬 대응)
				// stroke만 있으면: 선으로 처리

				if (pathStyle.fill && pathStyle.stroke) {
					// 둘 다 있으면 fill은 다각형으로
					const body = createFilledBody(vertices);
					if (body) {
						bodies.push(body);
					}
					// stroke는 선으로
					for (let i = 0; i < vertices.length - 1; i++) {
						const v1 = vertices[i];
						const v2 = vertices[i + 1];
						if (!v1 || !v2) continue;
						const body = createLineBody(v1.x, v1.y, v2.x, v2.y, pathStyle.strokeWidth);
						bodies.push(body);
					}
				} else {
					// fill만 또는 stroke만 있으면 선으로 처리
					const width = pathStyle.strokeWidth;
					for (let i = 0; i < vertices.length - 1; i++) {
						const v1 = vertices[i];
						const v2 = vertices[i + 1];
						if (!v1 || !v2) continue;
						const body = createLineBody(v1.x, v1.y, v2.x, v2.y, width);
						bodies.push(body);
					}
				}
			});

			return bodies;
		} catch (error) {
			console.error('Failed to load terrain SVG:', error);
			return [];
		}
	}

	function getCharacterBodySize(playerCharacter: PlayerCharacter): {
		width: number;
		height: number;
	} {
		const idleState = playerCharacter.character.character_states.find((s) => s.type === 'idle');
		if (!idleState?.atlas_name) {
			return { width: DEFAULT_CHARACTER_SIZE, height: DEFAULT_CHARACTER_SIZE };
		}

		const metadata = atlases[idleState.atlas_name];
		if (!metadata) {
			return { width: DEFAULT_CHARACTER_SIZE, height: DEFAULT_CHARACTER_SIZE };
		}

		return {
			width: metadata.frameWidth / CHARACTER_RESOLUTION,
			height: metadata.frameHeight / CHARACTER_RESOLUTION,
		};
	}

	function createCharacterBody(playerCharacter: PlayerCharacter): Matter.Body {
		const { width, height } = getCharacterBodySize(playerCharacter);
		const scaledX = scaleX(playerCharacter.x);
		// y 좌표는 캐릭터 발 위치 기준이므로, 바디 중심은 높이의 절반만큼 위로
		const scaledY = scaleY(playerCharacter.y) - height / 2;

		return Bodies.rectangle(scaledX, scaledY, width, height, {
			label: `character-${playerCharacter.id}`,
			restitution: 0.1,
			friction: 0.8,
			collisionFilter: {
				category: CATEGORY_CHARACTER,
				mask: CATEGORY_WALL | CATEGORY_TERRAIN | CATEGORY_CHARACTER, // 건물과 충돌하지 않음
			},
			render: debug ? { visible: true, fillStyle: 'rgba(0, 255, 0, 0.5)' } : { visible: false },
		});
	}

	function updateCharacterPositions() {
		const newPositions: Record<string, { x: number; y: number; angle: number }> = {};
		for (const [id, body] of Object.entries(characterBodies)) {
			const size = characterBodySizes[id];
			const halfHeight = size ? size.height / 2 : 0;
			// 바디 중심에서 발 위치(하단)로 변환 후 viewBox 좌표로 역변환
			newPositions[id] = {
				x: (body.position.x / canvasWidth) * VIEW_BOX_WIDTH,
				y: ((body.position.y + halfHeight) / canvasHeight) * VIEW_BOX_HEIGHT,
				angle: body.angle,
			};
		}
		characterPositions = newPositions;
	}

	function getBuildingBodySize(playerBuilding: PlayerBuilding): {
		width: number;
		height: number;
	} {
		const idleState = playerBuilding.building.building_states.find((s) => s.type === 'idle');
		if (!idleState?.atlas_name) {
			return { width: DEFAULT_BUILDING_SIZE, height: DEFAULT_BUILDING_SIZE };
		}

		const metadata = atlases[idleState.atlas_name];
		if (!metadata) {
			return { width: DEFAULT_BUILDING_SIZE, height: DEFAULT_BUILDING_SIZE };
		}

		return {
			width: metadata.frameWidth / BUILDING_RESOLUTION,
			height: metadata.frameHeight / BUILDING_RESOLUTION,
		};
	}

	function createBuildingBody(playerBuilding: PlayerBuilding): Matter.Body {
		const { width, height } = getBuildingBodySize(playerBuilding);
		const scaledX = scaleX(playerBuilding.x);
		// y 좌표는 건물 바닥 위치 기준이므로, 바디 중심은 높이의 절반만큼 위로
		const scaledY = scaleY(playerBuilding.y) - height / 2;

		return Bodies.rectangle(scaledX, scaledY, width, height, {
			label: `building-${playerBuilding.id}`,
			restitution: 0.1,
			friction: 0.8,
			inertia: Infinity, // 회전 방지
			collisionFilter: {
				category: CATEGORY_BUILDING,
				mask: CATEGORY_WALL | CATEGORY_TERRAIN | CATEGORY_BUILDING, // 캐릭터와 충돌하지 않음
			},
			render: debug ? { visible: true, fillStyle: 'rgba(0, 0, 255, 0.5)' } : { visible: false },
		});
	}

	function updateBuildingPositions() {
		const newPositions: Record<string, { x: number; y: number; angle: number }> = {};
		for (const [id, body] of Object.entries(buildingBodies)) {
			const size = buildingBodySizes[id];
			const halfHeight = size ? size.height / 2 : 0;
			// 바디 중심에서 바닥 위치(하단)로 변환 후 viewBox 좌표로 역변환
			newPositions[id] = {
				x: (body.position.x / canvasWidth) * VIEW_BOX_WIDTH,
				y: ((body.position.y + halfHeight) / canvasHeight) * VIEW_BOX_HEIGHT,
				angle: body.angle,
			};
		}
		buildingPositions = newPositions;
	}

	function createWalls(): Matter.Body[] {
		const wallOptions = {
			isStatic: true,
			render: wallStyle,
			collisionFilter: {
				category: CATEGORY_WALL,
				mask: CATEGORY_CHARACTER | CATEGORY_BUILDING, // 캐릭터, 건물과 충돌
			},
		};

		const ground = Bodies.rectangle(
			canvasWidth / 2,
			canvasHeight - WALL_THICKNESS / 2,
			canvasWidth,
			WALL_THICKNESS,
			wallOptions
		);
		const leftWall = Bodies.rectangle(
			WALL_THICKNESS / 2,
			canvasHeight / 2,
			WALL_THICKNESS,
			canvasHeight,
			wallOptions
		);
		const rightWall = Bodies.rectangle(
			canvasWidth - WALL_THICKNESS / 2,
			canvasHeight / 2,
			WALL_THICKNESS,
			canvasHeight,
			wallOptions
		);
		const ceiling = Bodies.rectangle(
			canvasWidth / 2,
			WALL_THICKNESS / 2,
			canvasWidth,
			WALL_THICKNESS,
			wallOptions
		);

		return [ground, leftWall, rightWall, ceiling];
	}

	onMount(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;

			const { width, height } = entry.contentRect;
			if (width === 0 || height === 0) return;

			canvasWidth = width;
			canvasHeight = height;

			if (render) {
				render.canvas.width = width;
				render.canvas.height = height;
				render.options.width = width;
				render.options.height = height;

				// 월드 재구성
				Composite.clear(engine.world, false);

				Composite.add(engine.world, createWalls());

				if (terrain?.game_asset) {
					loadTerrainSvg(terrain).then((terrainBodies) => {
						if (terrainBodies.length > 0) {
							Composite.add(engine.world, terrainBodies);
						}
					});
				}

				// 캐릭터 바디 재추가
				for (const body of Object.values(characterBodies)) {
					Composite.add(engine.world, body);
				}

				// 건물 바디 재추가
				for (const body of Object.values(buildingBodies)) {
					Composite.add(engine.world, body);
				}

				// 마우스 컨트롤 재추가
				const mouse = Mouse.create(render.canvas);
				const mouseConstraint = MouseConstraint.create(engine, {
					mouse,
					constraint: { stiffness: 0.2, render: { visible: false } },
				});
				Composite.add(engine.world, mouseConstraint);
				render.mouse = mouse;
			}
		});

		resizeObserver.observe(container);

		engine = Engine.create();

		render = Render.create({
			element: container,
			engine: engine,
			options: {
				width: canvasWidth,
				height: canvasHeight,
				wireframes: false,
				background: 'transparent',
			},
		});

		Composite.add(engine.world, createWalls());

		if (terrain?.game_asset) {
			loadTerrainSvg(terrain).then((terrainBodies) => {
				if (terrainBodies.length > 0) {
					Composite.add(engine.world, terrainBodies);
				}
			});
		}

		const mouse = Mouse.create(render.canvas);
		const mouseConstraint = MouseConstraint.create(engine, {
			mouse,
			constraint: { stiffness: 0.2, render: { visible: false } },
		});
		Composite.add(engine.world, mouseConstraint);
		render.mouse = mouse;

		Render.run(render);
		runner = Runner.create();
		Runner.run(runner, engine);

		// 물리 업데이트 후 캐릭터/건물 위치 동기화
		function onAfterUpdate() {
			updateCharacterPositions();
			updateBuildingPositions();
		}
		Matter.Events.on(engine, 'afterUpdate', onAfterUpdate);

		// 초기 캐릭터/건물 바디 생성
		syncCharacterBodies();
		syncBuildingBodies();
		mounted = true;

		return () => {
			mounted = false;
			Matter.Events.off(engine, 'afterUpdate', onAfterUpdate);
			resizeObserver.disconnect();
			Render.stop(render);
			Runner.stop(runner);
			Engine.clear(engine);
			render.canvas.remove();
		};
	});

	// 캐릭터 바디 동기화 함수
	function syncCharacterBodies() {
		if (!engine) return;

		const currentIds = new Set(characters.map((c) => c.id));
		const existingIds = new Set(Object.keys(characterBodies));

		let newBodies = { ...characterBodies };
		let newSizes = { ...characterBodySizes };
		let hasChanges = false;

		// 새로 추가된 캐릭터 바디 생성
		for (const char of characters) {
			if (!existingIds.has(char.id)) {
				const size = getCharacterBodySize(char);
				const body = createCharacterBody(char);
				newBodies[char.id] = body;
				newSizes[char.id] = size;
				Composite.add(engine.world, body);
				hasChanges = true;
			}
		}

		// 제거된 캐릭터 바디 삭제
		for (const id of existingIds) {
			if (!currentIds.has(id)) {
				const body = characterBodies[id];
				if (body) {
					Composite.remove(engine.world, body);
					delete newBodies[id];
					delete newSizes[id];
					hasChanges = true;
				}
			}
		}

		// 변경이 있을 때만 상태 업데이트
		if (hasChanges) {
			characterBodies = newBodies;
			characterBodySizes = newSizes;
		}
	}

	// 건물 바디 동기화 함수
	function syncBuildingBodies() {
		if (!engine) return;

		const currentIds = new Set(buildings.map((b) => b.id));
		const existingIds = new Set(Object.keys(buildingBodies));

		let newBodies = { ...buildingBodies };
		let newSizes = { ...buildingBodySizes };
		let hasChanges = false;

		// 새로 추가된 건물 바디 생성
		for (const building of buildings) {
			if (!existingIds.has(building.id)) {
				const size = getBuildingBodySize(building);
				const body = createBuildingBody(building);
				newBodies[building.id] = body;
				newSizes[building.id] = size;
				Composite.add(engine.world, body);
				hasChanges = true;
			}
		}

		// 제거된 건물 바디 삭제
		for (const id of existingIds) {
			if (!currentIds.has(id)) {
				const body = buildingBodies[id];
				if (body) {
					Composite.remove(engine.world, body);
					delete newBodies[id];
					delete newSizes[id];
					hasChanges = true;
				}
			}
		}

		// 변경이 있을 때만 상태 업데이트
		if (hasChanges) {
			buildingBodies = newBodies;
			buildingBodySizes = newSizes;
		}
	}

	// terrain.game_asset 변경 감지하여 재로드
	let prevGameAsset: string | null | undefined = terrain?.game_asset;
	$effect(() => {
		const currentGameAsset = terrain?.game_asset;
		if (currentGameAsset !== prevGameAsset && engine) {
			prevGameAsset = currentGameAsset;

			// 기존 terrain bodies 제거 후 재로드
			Composite.clear(engine.world, false);
			Composite.add(engine.world, createWalls());

			if (terrain?.game_asset) {
				loadTerrainSvg(terrain).then((terrainBodies) => {
					if (terrainBodies.length > 0) {
						Composite.add(engine.world, terrainBodies);
					}
				});
			}

			// 캐릭터 바디 재추가
			for (const body of Object.values(characterBodies)) {
				Composite.add(engine.world, body);
			}

			// 건물 바디 재추가
			for (const body of Object.values(buildingBodies)) {
				Composite.add(engine.world, body);
			}

			// 마우스 컨트롤 재추가
			if (render) {
				const mouse = Mouse.create(render.canvas);
				const mouseConstraint = MouseConstraint.create(engine, {
					mouse,
					constraint: { stiffness: 0.2, render: { visible: false } },
				});
				Composite.add(engine.world, mouseConstraint);
				render.mouse = mouse;
			}
		}
	});

	// debug 변경 시 기존 바디들의 렌더 스타일만 업데이트
	$effect(() => {
		if (!engine) return;

		const bodies = Composite.allBodies(engine.world);
		for (const body of bodies) {
			if (body.isStatic) {
				body.render.visible = debug;
				if (debug) {
					body.render.fillStyle = 'rgba(255, 0, 0, 0.5)';
				}
			}
		}
		// 캐릭터 바디도 디버그 모드에 따라 표시
		for (const body of Object.values(characterBodies)) {
			body.render.visible = debug;
			if (debug) {
				body.render.fillStyle = 'rgba(0, 255, 0, 0.5)';
			}
		}
		// 건물 바디도 디버그 모드에 따라 표시
		for (const body of Object.values(buildingBodies)) {
			body.render.visible = debug;
			if (debug) {
				body.render.fillStyle = 'rgba(0, 0, 255, 0.5)';
			}
		}
	});

	// characters prop 변경 시 바디 추가/제거
	// onMount 이후에만 실행 (초기 동기화는 onMount에서 처리)
	$effect(() => {
		const _deps = characters.map((c) => c.id);
		if (mounted) {
			syncCharacterBodies();
		}
	});

	// buildings prop 변경 시 바디 추가/제거
	$effect(() => {
		const _deps = buildings.map((b) => b.id);
		if (mounted) {
			syncBuildingBodies();
		}
	});
</script>

<div
	bind:this={container}
	data-slot="world-container"
	class="relative h-full w-full border border-border"
>
	{#if svgUrl}
		<img
			src={svgUrl}
			alt="terrain"
			class="pointer-events-none absolute inset-0 h-full w-full"
			style="object-fit: fill; opacity: {debug ? 0 : 1};"
		/>
	{/if}
	{#each buildings as playerBuilding (playerBuilding.id)}
		{@const position = buildingPositions[playerBuilding.id]}
		{#if position}
			<WorldBuilding {playerBuilding} x={position.x} y={position.y} angle={position.angle} />
		{/if}
	{/each}
	{#each characters as playerCharacter (playerCharacter.id)}
		{@const position = characterPositions[playerCharacter.id]}
		{#if position}
			<WorldCharacter {playerCharacter} x={position.x} y={position.y} angle={position.angle} />
		{/if}
	{/each}
	{@render children?.()}
</div>
