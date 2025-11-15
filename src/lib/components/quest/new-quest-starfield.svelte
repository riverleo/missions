<script lang="ts">
	import { onMount } from 'svelte';

	interface Star {
		id: number;
		x: number;
		y: number;
		size: number;
		opacity: number;
		interval: number;
	}

	let starIdCounter = 0;

	function generateStar({ size, interval }: { size: number; interval: number }): Star {
		return {
			id: starIdCounter++,
			x: Math.random() * 100,
			y: Math.random() * 100,
			size,
			opacity: 1,
			interval,
		};
	}

	function generateStars({
		size,
		count,
		interval,
	}: {
		size: number;
		count: number;
		interval: number;
	}): Star[] {
		return Array.from({ length: count }, () => generateStar({ size, interval }));
	}

	// 작은 별 9개, 중간 별 5개, 큰 별 11개
	let stars = $state<Star[]>([
		...generateStars({ size: 1, count: 9, interval: 2000 }),
		...generateStars({ size: 1.5, count: 5, interval: 2500 }),
		...generateStars({ size: 3, count: 11, interval: 3000 }),
	]);

	function transitionStar(index: number) {
		// 서서히 사라지기
		stars[index].opacity = 0;

		// 완전히 사라진 후 위치 변경
		setTimeout(() => {
			const star = stars[index];
			stars[index] = generateStar({ size: star.size, interval: star.interval });
			stars[index].opacity = 0;
			// 새 위치에서 서서히 나타나기
			setTimeout(() => {
				stars[index].opacity = 1;
			}, 50);
		}, 1500);
	}

	function scheduleStarTransition(index: number, timeouts: NodeJS.Timeout[]) {
		const star = stars[index];
		const randomDelay = Math.random() * star.interval;
		const timeoutId: NodeJS.Timeout = setTimeout(() => {
			transitionStar(index);
			const intervalId = setInterval(() => {
				transitionStar(index);
			}, star.interval);
			timeouts.push(intervalId);
		}, randomDelay);
		timeouts.push(timeoutId);
	}

	onMount(() => {
		const timeouts: NodeJS.Timeout[] = [];

		stars.forEach((_, i) => {
			scheduleStarTransition(i, timeouts);
		});

		return () => {
			timeouts.forEach((id) => {
				clearTimeout(id);
				clearInterval(id);
			});
		};
	});
</script>

<div class="starfield">
	{#each stars as star (star.id)}
		<div
			class="star"
			style="left: {star.x}%; top: {star.y}%; width: {star.size}px; height: {star.size}px; opacity: {star.opacity}"
		></div>
	{/each}
</div>

<style>
	.starfield {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.star {
		position: absolute;
		background: radial-gradient(circle, white, transparent);
		border-radius: 50%;
		pointer-events: none;
		transition: opacity 1.5s ease-in-out;
	}
</style>
