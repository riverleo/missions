<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Application, Container, Graphics, Text } from 'pixi.js';
	import type { Component } from 'svelte';

	interface Props {
		icon?: Component;
		title?: string;
		description?: string;
		delay?: number;
	}

	let {
		icon,
		title = '퀘스트 제목',
		description = '퀘스트 설명이 들어갑니다.',
		delay = 0,
	}: Props = $props();

	let canvasContainer: HTMLDivElement;
	let app: Application;
	let questContainer: Container;
	let isHovered = $state(false);

	// 애니메이션 속도 설정
	const ANIMATION_SPEED = 1;

	// 랜덤 값 생성
	const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;
	const randomMovement = (minAbs: number, maxAbs: number) => {
		const value = randomFloat(minAbs, maxAbs);
		return Math.random() > 0.5 ? value : -value;
	};

	const iconAnim = {
		duration: randomFloat(2.5, 4) * ANIMATION_SPEED,
		x: randomMovement(5, 10),
		y: randomMovement(5, 10),
		time: 0,
	};

	const titleAnim = {
		duration: randomFloat(2, 3.5) * ANIMATION_SPEED,
		x: randomMovement(4, 8),
		y: randomMovement(4, 8),
		time: randomFloat(0, 1),
	};

	const descAnim = {
		duration: randomFloat(1.5, 3) * ANIMATION_SPEED,
		x: randomMovement(3, 6),
		y: randomMovement(3, 6),
		time: randomFloat(0, 2),
	};

	function getFloatingOffset(anim: typeof iconAnim, deltaTime: number) {
		if (isHovered) return { x: 0, y: 0 };

		anim.time += deltaTime / 60; // 60fps 기준
		const progress = (anim.time % anim.duration) / anim.duration;

		// 키프레임 애니메이션
		let x = 0,
			y = 0;
		if (progress < 0.25) {
			const t = progress / 0.25;
			x = anim.x * t;
			y = anim.y * t;
		} else if (progress < 0.5) {
			const t = (progress - 0.25) / 0.25;
			x = anim.x + (anim.x * -0.5 - anim.x) * t;
			y = anim.y + (anim.y * 1.2 - anim.y) * t;
		} else if (progress < 0.75) {
			const t = (progress - 0.5) / 0.25;
			x = anim.x * -0.5 + (anim.x * 0.8 - anim.x * -0.5) * t;
			y = anim.y * 1.2 + (anim.y * -0.6 - anim.y * 1.2) * t;
		} else {
			const t = (progress - 0.75) / 0.25;
			x = anim.x * 0.8 + (0 - anim.x * 0.8) * t;
			y = anim.y * -0.6 + (0 - anim.y * -0.6) * t;
		}

		return { x, y };
	}

	onMount(async () => {
		// PixiJS Application 초기화
		app = new Application();
		await app.init({
			width: 500,
			height: 120,
			backgroundColor: 0x000000,
			backgroundAlpha: 0,
			antialias: true,
			resolution: window.devicePixelRatio || 1,
			autoDensity: true,
		});

		canvasContainer.appendChild(app.canvas);

		// 메인 컨테이너
		questContainer = new Container();
		app.stage.addChild(questContainer);

		// 배경 (호버용)
		const background = new Graphics();
		background.rect(0, 0, 500, 120);
		background.fill({ color: 0xffffff, alpha: 0 });
		questContainer.addChild(background);

		// 아이콘 영역 (임시로 원으로 표시)
		const iconContainer = new Container();
		const iconCircle = new Graphics();
		iconCircle.circle(0, 0, 32);
		iconCircle.fill({ color: 0x4a5568 });
		iconContainer.addChild(iconCircle);
		iconContainer.x = 48;
		iconContainer.y = 60;
		questContainer.addChild(iconContainer);

		// 제목 텍스트
		const titleText = new Text({
			text: title,
			style: {
				fontFamily: 'Arial',
				fontSize: 24,
				fontWeight: 'bold',
				fill: 0xffffff,
			},
		});
		titleText.x = 100;
		titleText.y = 30;
		questContainer.addChild(titleText);

		// 설명 텍스트
		const descText = new Text({
			text: description,
			style: {
				fontFamily: 'Arial',
				fontSize: 14,
				fill: 0xcccccc,
				wordWrap: true,
				wordWrapWidth: 380,
			},
		});
		descText.x = 100;
		descText.y = 65;
		questContainer.addChild(descText);

		// 애니메이션 루프
		let iconBaseX = iconContainer.x;
		let iconBaseY = iconContainer.y;
		let titleBaseX = titleText.x;
		let titleBaseY = titleText.y;
		let descBaseX = descText.x;
		let descBaseY = descText.y;

		app.ticker.add((ticker) => {
			const iconOffset = getFloatingOffset(iconAnim, ticker.deltaTime);
			const titleOffset = getFloatingOffset(titleAnim, ticker.deltaTime);
			const descOffset = getFloatingOffset(descAnim, ticker.deltaTime);

			iconContainer.x = iconBaseX + iconOffset.x;
			iconContainer.y = iconBaseY + iconOffset.y;
			titleText.x = titleBaseX + titleOffset.x;
			titleText.y = titleBaseY + titleOffset.y;
			descText.x = descBaseX + descOffset.x;
			descText.y = descBaseY + descOffset.y;

			// 호버 시 스케일 효과
			const targetScale = isHovered ? 1.05 : 1;
			questContainer.scale.x += (targetScale - questContainer.scale.x) * 0.1;
			questContainer.scale.y += (targetScale - questContainer.scale.y) * 0.1;

			// 호버 시 배경 알파
			const targetAlpha = isHovered ? 0.05 : 0;
			background.alpha += (targetAlpha - background.alpha) * 0.1;
		});

		// 페이드인 효과
		questContainer.alpha = 0;
		setTimeout(() => {
			const fadeIn = setInterval(() => {
				questContainer.alpha += 0.05;
				if (questContainer.alpha >= 1) {
					questContainer.alpha = 1;
					clearInterval(fadeIn);
				}
			}, 16);
		}, delay);
	});

	onDestroy(() => {
		if (app) {
			app.destroy(true, { children: true });
		}
	});

	function handleMouseEnter() {
		isHovered = true;
	}

	function handleMouseLeave() {
		isHovered = false;
	}
</script>

<div
	bind:this={canvasContainer}
	class="cursor-pointer"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	role="button"
	tabindex="0"
></div>

<style>
	div {
		display: block;
	}
</style>
