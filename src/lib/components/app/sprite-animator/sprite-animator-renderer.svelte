<script lang="ts">
	import type { SpriteAnimator } from './sprite-animator.svelte';

	interface Props {
		spriteAnimator: SpriteAnimator;
	}

	let { spriteAnimator }: Props = $props();

	const metadata = spriteAnimator.getMetadata();
	const atlasUrl = spriteAnimator.getAtlasUrl();

	// 현재 프레임에 따른 background-position 계산
	const backgroundPosition = $derived(() => {
		if (!metadata) return '0 0';

		const { frameWidth, frameHeight, columns } = metadata;
		const frame = spriteAnimator.currentFrame;

		const column = frame % columns;
		const row = Math.floor(frame / columns);

		const x = -(column * frameWidth);
		const y = -(row * frameHeight);

		return `${x}px ${y}px`;
	});
</script>

{#if metadata}
	<div
		class="sprite-animator-renderer"
		style:width="{metadata.frameWidth}px"
		style:height="{metadata.frameHeight}px"
		style:background-image="url({atlasUrl})"
		style:background-position={backgroundPosition()}
	></div>
{/if}

<style>
	.sprite-animator-renderer {
		background-repeat: no-repeat;
	}
</style>
