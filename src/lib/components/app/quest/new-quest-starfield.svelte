<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Application, Graphics } from 'pixi.js';

	interface Star {
		graphics: Graphics;
		speed: number;
		angle: number;
		distance: number;
	}

	let canvasContainer: HTMLDivElement;
	let app: Application;
	let stars: Star[] = [];

	const centerX = 0.5; // 비율로 저장 (50%)
	const centerY = 0.5;

	function generateStar(
		speed: number,
		width: number,
		height: number,
		initialDistance?: number
	): Star {
		const angle = Math.random() * Math.PI * 2;
		const distance = initialDistance !== undefined ? initialDistance : Math.random() * 1.2; // 초기에는 화면 전체에 분포

		const graphics = new Graphics();

		return {
			graphics,
			speed,
			angle,
			distance,
		};
	}

	function drawStar(graphics: Graphics, size: number, opacity: number) {
		graphics.clear();

		// 중앙 원
		graphics.circle(0, 0, size * 0.5);
		graphics.fill({ color: 0xffffff, alpha: opacity });

		// 십자가 빛
		const lineLength = size * 2;
		const lineWidth = size * 0.3;

		// 가로 선
		graphics.rect(-lineLength / 2, -lineWidth / 2, lineLength, lineWidth);
		graphics.fill({ color: 0xffffff, alpha: opacity * 0.5 });

		// 세로 선
		graphics.rect(-lineWidth / 2, -lineLength / 2, lineWidth, lineLength);
		graphics.fill({ color: 0xffffff, alpha: opacity * 0.5 });

		// 대각선 X (45도 회전된 십자가)
		const diagLength = lineLength * 0.6;
		const diagWidth = lineWidth * 0.5;
		const cos45 = Math.cos(Math.PI / 4);
		const sin45 = Math.sin(Math.PI / 4);

		// 대각선 1 (/)
		graphics.moveTo((-diagLength / 2) * cos45, (-diagLength / 2) * sin45);
		graphics.lineTo((diagLength / 2) * cos45, (diagLength / 2) * sin45);
		graphics.stroke({ width: diagWidth, color: 0xffffff, alpha: opacity * 0.3 });

		// 대각선 2 (\)
		graphics.moveTo((-diagLength / 2) * cos45, (diagLength / 2) * sin45);
		graphics.lineTo((diagLength / 2) * cos45, (-diagLength / 2) * sin45);
		graphics.stroke({ width: diagWidth, color: 0xffffff, alpha: opacity * 0.3 });
	}

	function updateStar(star: Star, width: number, height: number) {
		star.distance += star.speed / 100; // 속도 조정

		// 화면 밖으로 나가면 중앙에서 즉시 다시 시작
		if (star.distance > 1.4) {
			// 대각선까지 고려해서 1.4
			star.angle = Math.random() * Math.PI * 2;
			star.distance = 0; // 중앙에서 바로 시작
		}

		// 위치 계산
		const x = centerX * width + Math.cos(star.angle) * star.distance * width;
		const y = centerY * height + Math.sin(star.angle) * star.distance * height;

		// 크기와 투명도 계산
		const size = 1 + (star.distance / 1) * 2; // 1px → 3px
		const opacity = Math.min(star.distance / 0.5, 1);

		// Graphics 업데이트
		drawStar(star.graphics, size, opacity);
		star.graphics.x = x;
		star.graphics.y = y;
	}

	onMount(async () => {
		// PixiJS Application 초기화
		app = new Application();
		await app.init({
			resizeTo: canvasContainer,
			backgroundColor: 0x000000,
			backgroundAlpha: 1,
			antialias: true,
			resolution: window.devicePixelRatio || 1,
			autoDensity: true,
		});

		canvasContainer.appendChild(app.canvas);

		const width = app.screen.width;
		const height = app.screen.height;

		// 별 생성 (150개 느림, 100개 중간, 50개 빠름)
		const speeds = [
			{ count: 150, speed: 0.15 },
			{ count: 100, speed: 0.25 },
			{ count: 50, speed: 0.4 },
		];

		speeds.forEach(({ count, speed }) => {
			for (let i = 0; i < count; i++) {
				const star = generateStar(speed, width, height);
				stars.push(star);
				app.stage.addChild(star.graphics);
			}
		});

		// 애니메이션 루프
		app.ticker.add(() => {
			const width = app.screen.width;
			const height = app.screen.height;

			stars.forEach((star) => {
				updateStar(star, width, height);
			});
		});
	});

	onDestroy(() => {
		if (app) {
			app.destroy(true, { children: true });
		}
	});
</script>

<div bind:this={canvasContainer} class="absolute inset-0 z-0"></div>

<style>
	div {
		pointer-events: none;
	}
</style>
