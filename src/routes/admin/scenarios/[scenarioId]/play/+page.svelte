<script lang="ts">
	import { onMount } from 'svelte';
	import Matter from 'matter-js';

	const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint } = Matter;

	let container: HTMLDivElement;
	let engine: Matter.Engine;
	let render: Matter.Render;
	let runner: Matter.Runner;

	const WIDTH = 800;
	const HEIGHT = 400;
	const WALL_THICKNESS = 1;

	onMount(() => {
		// 엔진 생성
		engine = Engine.create();

		// 렌더러 생성
		render = Render.create({
			element: container,
			engine: engine,
			options: {
				width: WIDTH,
				height: HEIGHT,
				wireframes: false,
				background: 'transparent',
			},
		});

		// 바닥과 벽 생성
		const ground = Bodies.rectangle(WIDTH / 2, HEIGHT - WALL_THICKNESS / 2, WIDTH, WALL_THICKNESS, {
			isStatic: true,
			render: bodyStyle,
		});
		const leftWall = Bodies.rectangle(WALL_THICKNESS / 2, HEIGHT / 2, WALL_THICKNESS, HEIGHT, {
			isStatic: true,
			render: bodyStyle,
		});
		const rightWall = Bodies.rectangle(
			WIDTH - WALL_THICKNESS / 2,
			HEIGHT / 2,
			WALL_THICKNESS,
			HEIGHT,
			{
				isStatic: true,
				render: bodyStyle,
			}
		);
		const ceiling = Bodies.rectangle(WIDTH / 2, WALL_THICKNESS / 2, WIDTH, WALL_THICKNESS, {
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
			// 정리
			Render.stop(render);
			Runner.stop(runner);
			Engine.clear(engine);
			render.canvas.remove();
		};
	});

	const bodyStyle = {
		fillStyle: 'white',
	};
</script>

<div class="flex h-full items-center justify-center">
	<div bind:this={container}></div>
</div>
