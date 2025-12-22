<script lang="ts">
	import type { BuildingState, LoopMode } from '$lib/types';
	import { SpriteAnimator } from './sprite-animator.svelte';
	import SpriteAnimatorRenderer from './sprite-animator-renderer.svelte';

	interface Props {
		buildingState: BuildingState;
		resolution?: 1 | 2 | 3;
	}

	let { buildingState, resolution = 1 }: Props = $props();

	let animator = $state<SpriteAnimator | undefined>(undefined);

	$effect(() => {
		const atlasName = buildingState.atlas_name;

		SpriteAnimator.create(atlasName).then((newAnimator) => {
			animator?.stop();
			newAnimator.init({
				name: buildingState.type,
				from: buildingState.frame_from ?? undefined,
				to: buildingState.frame_to ?? undefined,
				fps: buildingState.fps ?? undefined,
			});
			newAnimator.play({
				name: buildingState.type,
				loop: (buildingState.loop as LoopMode) ?? 'loop',
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
