<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import 'pathseg';
	import Matter from 'matter-js';
	import type { Terrain } from '$lib/types';
	import { getGameAssetUrl } from '$lib/utils/storage';
	import { useServerPayload } from '$lib/hooks/use-server-payload.svelte';

	import { VIEW_BOX_WIDTH, VIEW_BOX_HEIGHT } from './constants';

	const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Svg, Vertices } =
		Matter;

	interface Props {
		terrain?: Terrain;
		debug?: boolean;
		children?: Snippet;
	}

	let { terrain, debug = false, children }: Props = $props();

	const { supabase } = useServerPayload();

	let container: HTMLDivElement;
	let engine: Matter.Engine;
	let render: Matter.Render;
	let runner: Matter.Runner;
	let canvasWidth = $state(VIEW_BOX_WIDTH);
	let canvasHeight = $state(VIEW_BOX_HEIGHT);

	const WALL_THICKNESS = 1;

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
		const strokeWidthStr = strokeWidthMatch?.[1]?.trim() || path.getAttribute('stroke-width') || '1';

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

	function createWalls(): Matter.Body[] {
		const ground = Bodies.rectangle(
			canvasWidth / 2,
			canvasHeight - WALL_THICKNESS / 2,
			canvasWidth,
			WALL_THICKNESS,
			{ isStatic: true, render: wallStyle }
		);
		const leftWall = Bodies.rectangle(
			WALL_THICKNESS / 2,
			canvasHeight / 2,
			WALL_THICKNESS,
			canvasHeight,
			{ isStatic: true, render: wallStyle }
		);
		const rightWall = Bodies.rectangle(
			canvasWidth - WALL_THICKNESS / 2,
			canvasHeight / 2,
			WALL_THICKNESS,
			canvasHeight,
			{ isStatic: true, render: wallStyle }
		);
		const ceiling = Bodies.rectangle(
			canvasWidth / 2,
			WALL_THICKNESS / 2,
			canvasWidth,
			WALL_THICKNESS,
			{ isStatic: true, render: wallStyle }
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

		return () => {
			resizeObserver.disconnect();
			Render.stop(render);
			Runner.stop(runner);
			Engine.clear(engine);
			render.canvas.remove();
		};
	});

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
	{@render children?.()}
</div>
