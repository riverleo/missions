<script lang="ts">
	import type { TileId, TileStateType, LoopMode } from '$lib/types';
	import type { HTMLAttributes } from 'svelte/elements';
	import { SpriteAnimator } from './sprite-animator.svelte';
	import SpriteAnimatorRenderer from './sprite-animator-renderer.svelte';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { cn } from '$lib/utils';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		tileId: TileId;
		stateType: TileStateType;
		resolution?: 1 | 2 | 3;
	}

	let { tileId, stateType, resolution = 3, class: className, ...restProps }: Props = $props();

	const { tileStateStore } = useTerrain();
	const tileStates = $derived($tileStateStore.data[tileId] ?? []);
	const tileState = $derived(tileStates.find((s) => s.type === stateType));

	let animator = $state<SpriteAnimator | undefined>(undefined);

	$effect(() => {
		const atlasName = tileState?.atlas_name;
		if (!atlasName) return;

		SpriteAnimator.create(atlasName).then((newAnimator) => {
			animator?.stop();
			newAnimator.init({
				name: tileState.type,
				from: tileState.frame_from ?? undefined,
				to: tileState.frame_to ?? undefined,
				fps: tileState.fps ?? undefined,
			});
			newAnimator.play({
				name: tileState.type,
				loop: (tileState.loop as LoopMode) ?? 'loop',
			});
			animator = newAnimator;
		});

		return () => {
			animator?.stop();
		};
	});
</script>

<div {...restProps} class={cn('relative flex items-center justify-center', className)}>
	{#if animator}
		<SpriteAnimatorRenderer {animator} {resolution} />
	{/if}
</div>
