<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Application, Assets, Texture, AnimatedSprite, Rectangle } from 'pixi.js';

	let canvasContainer: HTMLDivElement;
	let app: Application;

	onMount(async () => {
		// PixiJS Application 초기화
		app = new Application();
		await app.init({
			width: 400,
			height: 300,
			backgroundAlpha: 0,
			antialias: true,
			resolution: window.devicePixelRatio || 1,
			autoDensity: true,
		});

		canvasContainer.appendChild(app.canvas);

		// Sprite sheet 이미지 로드
		const texture = await Assets.load('/professor_walk_cycle_no_hat.png');

		// Sprite sheet 정보
		// 일반적으로 walk cycle은 6-8프레임 정도입니다
		// 이미지 크기에 따라 프레임 수와 크기를 조정해야 합니다
		const frameWidth = 64; // 프레임 하나의 너비 (추정)
		const frameHeight = 64; // 프레임 하나의 높이 (추정)
		const numFrames = 8; // 프레임 개수 (추정)

		// 텍스처를 프레임별로 분할
		const frames: Texture[] = [];
		for (let i = 0; i < numFrames; i++) {
			const rect = new Rectangle(i * frameWidth, 0, frameWidth, frameHeight);
			const frameTexture = new Texture({
				source: texture.source,
				frame: rect,
			});
			frames.push(frameTexture);
		}

		// AnimatedSprite 생성
		const animatedSprite = new AnimatedSprite(frames);
		animatedSprite.animationSpeed = 0.1; // 애니메이션 속도
		animatedSprite.play();

		// 화면 중앙에 배치
		animatedSprite.x = app.screen.width / 2;
		animatedSprite.y = app.screen.height / 2;
		animatedSprite.anchor.set(0.5);

		// 스케일 조정 (필요시)
		animatedSprite.scale.set(2);

		app.stage.addChild(animatedSprite);

		// 디버그 정보 표시
		console.log('Texture size:', texture.width, 'x', texture.height);
		console.log('Frames:', frames.length);
	});

	onDestroy(() => {
		if (app) {
			app.destroy(true, { children: true });
		}
	});
</script>

<div bind:this={canvasContainer}></div>
