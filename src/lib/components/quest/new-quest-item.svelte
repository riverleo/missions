<script lang="ts">
	import type { Component } from 'svelte';
	import { fade } from 'svelte/transition';

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

	// 애니메이션 속도 설정 (값이 클수록 느림)
	const ANIMATION_SPEED = 1;

	// 랜덤 애니메이션 값 생성
	const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

	// 최소 이동량을 보장하는 랜덤 값 생성 (0 근처 값 방지)
	const randomMovement = (minAbs: number, maxAbs: number) => {
		const value = randomFloat(minAbs, maxAbs);
		return Math.random() > 0.5 ? value : -value;
	};

	const generateAnimation = (
		durationMin: number,
		durationMax: number,
		moveMin: number,
		moveMax: number
	) => ({
		duration: randomFloat(durationMin, durationMax) * ANIMATION_SPEED,
		x: randomMovement(moveMin, moveMax),
		y: randomMovement(moveMin, moveMax),
		delay: randomFloat(0, 1),
	});

	let iconAnimation = $state(generateAnimation(2.5, 4, 5, 10));
	let titleAnimation = $state(generateAnimation(2, 3.5, 4, 8));
	let descAnimation = $state(generateAnimation(1.5, 3, 3, 6));
</script>

<div class="quest-item flex w-[500px] items-center gap-4 rounded-lg p-4 transition-all duration-200 hover:scale-105 hover:bg-white/5 cursor-pointer">
	<!-- 아이콘 영역 -->
	<div
		class="floating-element flex h-16 w-16 shrink-0 items-center justify-center rounded"
		style="--float-x: {iconAnimation.x}px; --float-y: {iconAnimation.y}px; --duration: {iconAnimation.duration}s; --delay: {iconAnimation.delay}s;"
		transition:fade={{ duration: 300, delay }}
	>
		{#if icon}
			{@const Icon = icon}
			<Icon class="size-8" />
		{:else}
			<div class="text-2xl">?</div>
		{/if}
	</div>

	<!-- 텍스트 영역 -->
	<div class="flex flex-col gap-1">
		<div
			class="floating-element text-2xl font-bold text-gray-900 dark:text-gray-100"
			style="--float-x: {titleAnimation.x}px; --float-y: {titleAnimation.y}px; --duration: {titleAnimation.duration}s; --delay: {titleAnimation.delay}s;"
			transition:fade={{ duration: 300, delay: delay + 100 }}
		>
			{title}
		</div>
		<div
			class="floating-element text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
			style="--float-x: {descAnimation.x}px; --float-y: {descAnimation.y}px; --duration: {descAnimation.duration}s; --delay: {descAnimation.delay}s;"
			transition:fade={{ duration: 300, delay: delay + 200 }}
		>
			{description}
		</div>
	</div>
</div>

<style>
	@keyframes floating {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(var(--float-x), var(--float-y));
		}
		50% {
			transform: translate(calc(var(--float-x) * -0.5), calc(var(--float-y) * 1.2));
		}
		75% {
			transform: translate(calc(var(--float-x) * 0.8), calc(var(--float-y) * -0.6));
		}
	}

	.floating-element {
		animation: floating var(--duration) ease-in-out var(--delay) infinite;
		transition: transform 0.5s ease-out;
	}

	.quest-item:hover .floating-element {
		animation: none;
		transform: translate(0, 0);
	}
</style>
