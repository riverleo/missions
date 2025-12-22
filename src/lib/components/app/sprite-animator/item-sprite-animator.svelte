<script lang="ts">
	import type { ItemState, LoopMode } from '$lib/types';
	import { SpriteAnimator } from './sprite-animator.svelte';
	import SpriteAnimatorRenderer from './sprite-animator-renderer.svelte';

	interface Props {
		itemState: ItemState;
		resolution?: 1 | 2 | 3;
	}

	let { itemState, resolution = 1 }: Props = $props();

	let animator = $state<SpriteAnimator | undefined>(undefined);

	$effect(() => {
		const atlasName = itemState.atlas_name;

		SpriteAnimator.create(atlasName).then((newAnimator) => {
			animator?.stop();
			newAnimator.init({
				name: itemState.type,
				from: itemState.frame_from ?? undefined,
				to: itemState.frame_to ?? undefined,
				fps: itemState.fps ?? undefined,
			});
			newAnimator.play({
				name: itemState.type,
				loop: (itemState.loop as LoopMode) ?? 'loop',
			});
			animator = newAnimator;
		});

		return () => {
			animator?.stop();
		};
	});
</script>

<div class="relative inline-flex items-center justify-center">
	{#if animator}
		<SpriteAnimatorRenderer {animator} {resolution} />
	{/if}
</div>
