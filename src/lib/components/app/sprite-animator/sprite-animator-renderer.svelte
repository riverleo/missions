<script lang="ts">
	import type { SpriteAnimator } from './sprite-animator.svelte';

	interface Props {
		animator: SpriteAnimator;
		resolution?: 1 | 2 | 3;
	}

	let { animator, resolution = 2 }: Props = $props();

	// animator prop이 변경될 때 반응하도록 $derived 사용
	const metadata = $derived(animator.getMetadata());
	const atlasUrl = $derived(animator.getAtlasUrl());

	// 현재 프레임에 따른 background-position 계산
	const backgroundPosition = $derived.by(() => {
		if (!metadata) return '0 0';

		const { frameWidth, frameHeight, columns } = metadata;
		const frame = animator.currentFrame;

		const column = frame % columns;
		const row = Math.floor(frame / columns);

		const x = -(column * frameWidth) / resolution;
		const y = -(row * frameHeight) / resolution;

		return `${x}px ${y}px`;
	});

	// CSS에 적용할 크기 (resolution으로 나눔)
	const displayWidth = $derived(metadata ? metadata.frameWidth / resolution : 0);
	const displayHeight = $derived(metadata ? metadata.frameHeight / resolution : 0);
	const backgroundSize = $derived(
		metadata
			? `${(metadata.columns * metadata.frameWidth) / resolution}px ${(metadata.rows * metadata.frameHeight) / resolution}px`
			: 'auto'
	);
</script>

{#if metadata}
	<div
		class="sprite-animator-renderer"
		style:width="{displayWidth}px"
		style:height="{displayHeight}px"
		style:background-image="url({atlasUrl})"
		style:background-position={backgroundPosition}
		style:background-size={backgroundSize}
	></div>
{/if}

<style>
	.sprite-animator-renderer {
		background-repeat: no-repeat;
	}
</style>
