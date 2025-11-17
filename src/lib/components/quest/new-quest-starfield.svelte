<script lang="ts">
	import { onMount } from 'svelte';

	interface Star {
		id: number;
		x: number;
		y: number;
		size: number;
		speed: number;
		angle: number;
		distance: number;
	}

	let starIdCounter = 0;
	const centerX = 50;
	const centerY = 50;

	function generateStar(speed: number): Star {
		const angle = Math.random() * Math.PI * 2;
		const distance = Math.random() * 20; // 시작 거리 랜덤

		return {
			id: starIdCounter++,
			x: centerX + Math.cos(angle) * distance,
			y: centerY + Math.sin(angle) * distance,
			size: 1,
			speed,
			angle,
			distance,
		};
	}

	function generateStars(count: number, speed: number): Star[] {
		return Array.from({ length: count }, () => generateStar(speed));
	}

	let stars = $state<Star[]>([
		...generateStars(150, 0.1),
		...generateStars(100, 0.2),
		...generateStars(50, 0.3),
	]);

	let animationFrame: number;

	function animate() {
		stars = stars.map((star) => {
			let newDistance = star.distance + star.speed;

			// 화면 밖으로 나가면 중앙에서 다시 시작
			if (newDistance > 100) {
				return generateStar(star.speed);
			}

			return {
				...star,
				distance: newDistance,
				x: centerX + Math.cos(star.angle) * newDistance,
				y: centerY + Math.sin(star.angle) * newDistance,
				size: 1 + (newDistance / 100) * 2, // 거리에 따라 크기 증가
			};
		});

		animationFrame = requestAnimationFrame(animate);
	}

	onMount(() => {
		animate();

		return () => {
			if (animationFrame) {
				cancelAnimationFrame(animationFrame);
			}
		};
	});
</script>

<div class="absolute inset-0 z-0 overflow-hidden">
	{#each stars as star (star.id)}
		<div
			class="star pointer-none absolute rounded-full"
			style="left: {star.x}%; top: {star.y}%; width: {star.size}px; height: {star.size}px; opacity: {Math.min(
				star.distance / 50,
				1
			)}"
		></div>
	{/each}
</div>

<style>
	.star {
		background: radial-gradient(circle, white, transparent);
	}
</style>
