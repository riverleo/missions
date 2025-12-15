<script lang="ts">
	import { onMount } from 'svelte';
	import Matter from 'matter-js';

	const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint } = Matter;

	interface Props {
		width?: number;
		height?: number;
	}

	let { width = 800, height = 400 }: Props = $props();

	let container: HTMLDivElement;
	let engine: Matter.Engine;
	let render: Matter.Render;
	let runner: Matter.Runner;

	const WALL_THICKNESS = 1;

	const bodyStyle = {
		fillStyle: 'white',
	};

	onMount(() => {
		engine = Engine.create();

		render = Render.create({
			element: container,
			engine: engine,
			options: {
				width,
				height,
				wireframes: false,
				background: 'transparent',
			},
		});

		// 바닥과 벽 생성
		const ground = Bodies.rectangle(width / 2, height - WALL_THICKNESS / 2, width, WALL_THICKNESS, {
			isStatic: true,
			render: bodyStyle,
		});
		const leftWall = Bodies.rectangle(WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height, {
			isStatic: true,
			render: bodyStyle,
		});
		const rightWall = Bodies.rectangle(
			width - WALL_THICKNESS / 2,
			height / 2,
			WALL_THICKNESS,
			height,
			{
				isStatic: true,
				render: bodyStyle,
			}
		);
		const ceiling = Bodies.rectangle(width / 2, WALL_THICKNESS / 2, width, WALL_THICKNESS, {
			isStatic: true,
			render: bodyStyle,
		});

		Composite.add(engine.world, [ground, leftWall, rightWall, ceiling]);

		// 마우스 컨트롤 추가
		const mouse = Mouse.create(render.canvas);
		const mouseConstraint = MouseConstraint.create(engine, {
			mouse: mouse,
			constraint: {
				stiffness: 0.2,
				render: { visible: false },
			},
		});

		Composite.add(engine.world, mouseConstraint);
		render.mouse = mouse;

		// 렌더러와 러너 시작
		Render.run(render);
		runner = Runner.create();
		Runner.run(runner, engine);

		return () => {
			Render.stop(render);
			Runner.stop(runner);
			Engine.clear(engine);
			render.canvas.remove();
		};
	});
</script>

<div bind:this={container}></div>
