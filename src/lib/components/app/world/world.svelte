<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import 'pathseg';
	import Matter from 'matter-js';
	import type { Terrain, WorldCharacter, WorldBuilding } from '$lib/types';
	import { getGameAssetUrl } from '$lib/utils/storage.svelte';
	import { setWorldContext } from '$lib/hooks/use-world.svelte';

	import {
		CHARACTER_RESOLUTION,
		BUILDING_RESOLUTION,
		DEFAULT_CHARACTER_SIZE,
		DEFAULT_BUILDING_SIZE,
		WALL_THICKNESS,
		CATEGORY_WALL,
		CATEGORY_TERRAIN,
		CATEGORY_CHARACTER,
		CATEGORY_BUILDING,
		DEBUG_BODY_STYLE,
		HIDDEN_BODY_STYLE,
	} from './constants';
	import { Camera } from './camera.svelte';
	import WorldCharacterSprite from './world-character.svelte';
	import WorldBuildingSprite from './world-building.svelte';
	import { atlases } from '$lib/components/app/sprite-animator';

	const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Svg, Vertices } =
		Matter;

	interface Props {
		terrain?: Terrain;
		characters?: WorldCharacter[];
		buildings?: WorldBuilding[];
		debug?: boolean;
		children?: Snippet;
		oncamerachange?: (camera: Camera) => void;
	}

	let {
		terrain,
		characters = [],
		buildings = [],
		debug = false,
		children,
		oncamerachange,
	}: Props = $props();

	// 월드 크기 (terrain SVG에서 설정)
	let worldWidth = $state(0);
	let worldHeight = $state(0);

	// Context로 월드 크기 공유 (getter로 반응성 유지)
	setWorldContext({
		get width() {
			return worldWidth;
		},
		get height() {
			return worldHeight;
		},
	});

	let container: HTMLDivElement;
	let engine: Matter.Engine;
	let render: Matter.Render;
	let runner: Matter.Runner;
	let mouseConstraint: Matter.MouseConstraint;

	// 카메라
	const camera = new Camera();

	// 캐릭터 바디 관리 (Matter.js 객체는 $state.raw로 Proxy 방지)
	let characterBodies = $state.raw<Record<string, Matter.Body>>({});
	let characterBodySizes = $state.raw<Record<string, { width: number; height: number }>>({});
	let characterPositions = $state<Record<string, { x: number; y: number; angle: number }>>({});

	// 건물 바디 관리
	let buildingBodies = $state.raw<Record<string, Matter.Body>>({});
	let buildingBodySizes = $state.raw<Record<string, { width: number; height: number }>>({});
	let buildingPositions = $state<Record<string, { x: number; y: number; angle: number }>>({});

	let mounted = false;

	const wallStyle = $derived(debug ? DEBUG_BODY_STYLE : HIDDEN_BODY_STYLE);

	const svgUrl = $derived(terrain ? getGameAssetUrl('terrain', terrain) : undefined);

	function getPathStyle(path: SVGPathElement) {
		const style = path.getAttribute('style') || '';

		const fillMatch = style.match(/fill\s*:\s*([^;]+)/);
		const strokeMatch = style.match(/stroke\s*:\s*([^;]+)/);
		const strokeWidthMatch = style.match(/stroke-width\s*:\s*([^;]+)/);

		const fillValue = fillMatch?.[1]?.trim() || path.getAttribute('fill');
		const strokeValue = strokeMatch?.[1]?.trim() || path.getAttribute('stroke');
		const strokeWidthStr =
			strokeWidthMatch?.[1]?.trim() || path.getAttribute('stroke-width') || '1';

		return {
			fill: fillValue === 'none' ? undefined : fillValue,
			stroke: strokeValue === 'none' ? undefined : strokeValue,
			strokeWidth: parseFloat(strokeWidthStr) || 1,
		};
	}

	function getBodyRenderStyle(): Matter.IBodyRenderOptions {
		return debug ? DEBUG_BODY_STYLE : HIDDEN_BODY_STYLE;
	}

	function createLineBody(
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		width: number
	): Matter.Body {
		// SVG 좌표 = 월드 좌표
		const cx = (x1 + x2) / 2;
		const cy = (y1 + y2) / 2;
		const dx = x2 - x1;
		const dy = y2 - y1;
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

		// SVG 좌표 = 월드 좌표
		const center = Vertices.centre(vertices);
		const body = Bodies.fromVertices(center.x, center.y, [vertices], {
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
		const url = getGameAssetUrl('terrain', terrain);
		if (!url) return [];

		try {
			const response = await fetch(url);
			const svgText = await response.text();

			const parser = new DOMParser();
			const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');

			// SVG viewBox에서 월드 크기 추출
			const svgElement = svgDoc.querySelector('svg');
			if (svgElement) {
				const viewBox = svgElement.getAttribute('viewBox');
				if (viewBox) {
					const [, , vbWidth, vbHeight] = viewBox.split(/\s+/).map(Number);
					if (vbWidth && vbHeight) {
						worldWidth = vbWidth;
						worldHeight = vbHeight;
					}
				}
			}

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

	function getCharacterBodySize(worldCharacter: WorldCharacter): {
		width: number;
		height: number;
	} {
		const idleState = worldCharacter.character.character_states.find((s) => s.type === 'idle');
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

	function createCharacterBody(worldCharacter: WorldCharacter): Matter.Body {
		const { width, height } = getCharacterBodySize(worldCharacter);
		// 월드 좌표 사용 (y는 발 위치 기준이므로 바디 중심은 높이의 절반만큼 위로)
		const bodyX = worldCharacter.x;
		const bodyY = worldCharacter.y - height / 2;

		return Bodies.rectangle(bodyX, bodyY, width, height, {
			label: `character-${worldCharacter.id}`,
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
			// 바디 중심에서 발 위치(하단)로 변환 (월드 좌표)
			newPositions[id] = {
				x: body.position.x,
				y: body.position.y + halfHeight,
				angle: body.angle,
			};
		}
		characterPositions = newPositions;
	}

	function getBuildingBodySize(worldBuilding: WorldBuilding): {
		width: number;
		height: number;
	} {
		const idleState = worldBuilding.building.building_states.find((s) => s.type === 'idle');
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

	function createBuildingBody(worldBuilding: WorldBuilding): Matter.Body {
		const { width, height } = getBuildingBodySize(worldBuilding);
		// 월드 좌표 사용 (y는 바닥 위치 기준이므로 바디 중심은 높이의 절반만큼 위로)
		const bodyX = worldBuilding.x;
		const bodyY = worldBuilding.y - height / 2;

		return Bodies.rectangle(bodyX, bodyY, width, height, {
			label: `building-${worldBuilding.id}`,
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
			// 바디 중심에서 바닥 위치(하단)로 변환 (월드 좌표)
			newPositions[id] = {
				x: body.position.x,
				y: body.position.y + halfHeight,
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

		// 월드 경계에 벽 생성 (월드 좌표 기준)
		const ground = Bodies.rectangle(
			worldWidth / 2,
			worldHeight - WALL_THICKNESS / 2,
			worldWidth,
			WALL_THICKNESS,
			wallOptions
		);
		const leftWall = Bodies.rectangle(
			WALL_THICKNESS / 2,
			worldHeight / 2,
			WALL_THICKNESS,
			worldHeight,
			wallOptions
		);
		const rightWall = Bodies.rectangle(
			worldWidth - WALL_THICKNESS / 2,
			worldHeight / 2,
			WALL_THICKNESS,
			worldHeight,
			wallOptions
		);
		const ceiling = Bodies.rectangle(
			worldWidth / 2,
			WALL_THICKNESS / 2,
			worldWidth,
			WALL_THICKNESS,
			wallOptions
		);

		return [ground, leftWall, rightWall, ceiling];
	}

	// 카메라 줌 핸들러
	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const rect = container.getBoundingClientRect();
		camera.applyZoom(e.deltaY, rect, e.clientX, e.clientY);
		updateRenderBounds();
	}

	// 카메라 팬 상태
	let isPanning = $state(false);

	// 호버 상태
	let isOverDraggable = $state(false);

	// 마우스 위치에서 드래그 가능한 바디 확인
	function checkDraggableAtPosition(screenX: number, screenY: number): boolean {
		if (!engine || !container) return false;

		const rect = container.getBoundingClientRect();
		const worldPos = camera.screenToWorld(screenX, screenY, rect);
		const bodies = Matter.Query.point(Composite.allBodies(engine.world), worldPos);
		return bodies.some((b) => !b.isStatic);
	}

	function handleMouseDown(e: MouseEvent) {
		// 중간 버튼 또는 좌클릭으로 팬 (Command 키가 눌려있지 않을 때)
		if (e.button === 1 || (e.button === 0 && !e.metaKey)) {
			// 드래그 가능한 바디 위면 카메라 이동하지 않음
			if (isOverDraggable) return;

			e.preventDefault();
			isPanning = true;
			camera.startPan(e.clientX, e.clientY);
		}
	}

	function handleMouseMove(e: MouseEvent) {
		// 호버 상태 업데이트
		if (!isPanning) {
			const newValue = checkDraggableAtPosition(e.clientX, e.clientY);
			if (newValue !== isOverDraggable) {
				isOverDraggable = newValue;
			}
		}

		if (!isPanning) return;

		camera.updatePan(e.clientX, e.clientY);
		updateRenderBounds();
	}

	function handleMouseUp() {
		isPanning = false;
	}

	// Matter.js render bounds 업데이트 및 카메라 변경 알림
	function updateRenderBounds() {
		if (!render) return;

		const viewWidth = worldWidth / camera.zoom;
		const viewHeight = worldHeight / camera.zoom;

		render.bounds.min.x = camera.x;
		render.bounds.min.y = camera.y;
		render.bounds.max.x = camera.x + viewWidth;
		render.bounds.max.y = camera.y + viewHeight;

		oncamerachange?.(camera);
	}

	onMount(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;

			const { width, height } = entry.contentRect;
			if (width === 0 || height === 0) return;

			if (render) {
				render.canvas.width = width;
				render.canvas.height = height;
				render.options.width = width;
				render.options.height = height;
				updateRenderBounds();
			}
		});

		resizeObserver.observe(container);

		engine = Engine.create();

		render = Render.create({
			element: container,
			engine: engine,
			options: {
				width: container.clientWidth,
				height: container.clientHeight,
				wireframes: false,
				background: 'transparent',
				hasBounds: true,
			},
		});

		// 초기화 함수
		async function initWorld() {
			if (terrain?.game_asset) {
				// SVG 로드 후 월드 크기 설정
				const terrainBodies = await loadTerrainSvg(terrain);
				Composite.add(engine.world, createWalls());
				if (terrainBodies.length > 0) {
					Composite.add(engine.world, terrainBodies);
				}
			} else {
				Composite.add(engine.world, createWalls());
			}
			updateRenderBounds();
		}

		initWorld();

		const mouse = Mouse.create(render.canvas);
		mouseConstraint = MouseConstraint.create(engine, {
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

			// 기존 bodies 제거
			Composite.clear(engine.world, false);

			if (terrain?.game_asset) {
				// SVG 로드 후 월드 크기가 설정되고 나서 벽 생성
				loadTerrainSvg(terrain).then((terrainBodies) => {
					Composite.add(engine.world, createWalls());
					if (terrainBodies.length > 0) {
						Composite.add(engine.world, terrainBodies);
					}
					rebuildWorld();
				});
			}
		}
	});

	// 월드 재구성 (캐릭터, 건물, 마우스 컨트롤 추가)
	function rebuildWorld() {
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
			const mc = MouseConstraint.create(engine, {
				mouse,
				constraint: { stiffness: 0.2, render: { visible: false } },
			});
			Composite.add(engine.world, mc);
			render.mouse = mouse;
		}

		// 카메라 bounds 업데이트
		updateRenderBounds();
	}

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

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={container}
	data-slot="world-container"
	class="relative h-full w-full overflow-hidden border border-border"
	onwheel={handleWheel}
	onmousedown={handleMouseDown}
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
	onmouseleave={handleMouseUp}
>
	<!-- 월드 레이어: 카메라 transform 일괄 적용 -->
	<div
		class="pointer-events-none absolute origin-top-left"
		style="
			width: {worldWidth}px;
			height: {worldHeight}px;
			transform: scale({camera.zoom}) translate({-camera.x}px, {-camera.y}px);
		"
	>
		{#if svgUrl}
			<img
				src={svgUrl}
				alt="terrain"
				class="absolute inset-0 h-full w-full"
				style="opacity: {debug ? 0 : 1};"
			/>
		{/if}
		{#each buildings as worldBuilding (worldBuilding.id)}
			{@const position = buildingPositions[worldBuilding.id]}
			{#if position}
				<WorldBuildingSprite
					{worldBuilding}
					x={position.x}
					y={position.y}
					angle={position.angle}
					{worldWidth}
					{worldHeight}
				/>
			{/if}
		{/each}
		{#each characters as worldCharacter (worldCharacter.id)}
			{@const position = characterPositions[worldCharacter.id]}
			{#if position}
				<WorldCharacterSprite
					{worldCharacter}
					x={position.x}
					y={position.y}
					angle={position.angle}
					{worldWidth}
					{worldHeight}
				/>
			{/if}
		{/each}
	</div>
	{@render children?.()}
</div>
