<script lang="ts">
	import type { TileId, TileStateType, LoopMode } from '$lib/types';
	import type { HTMLAttributes } from 'svelte/elements';
	import { SpriteAnimator } from './sprite-animator.svelte';
	import SpriteAnimatorRenderer from './sprite-animator-renderer.svelte';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { cn } from '$lib/utils';

	const OUTLINE_WIDTH = 10;

	interface Props extends HTMLAttributes<HTMLDivElement> {
		tileId: TileId;
		stateType: TileStateType;
		resolution?: 1 | 2 | 3;
		selected?: boolean;
	}

	let {
		tileId,
		stateType,
		resolution = 1,
		selected = false,
		class: className,
		...restProps
	}: Props = $props();

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
	<!-- 선택 시 외곽선 레이어 -->
	{#if selected && animator}
		<div
			class="pointer-events-none absolute -z-10"
			style:transform="scale({1 + OUTLINE_WIDTH / 100})"
			style:filter="brightness(0) invert(1)"
		>
			<SpriteAnimatorRenderer {animator} {resolution} />
		</div>
	{/if}

	<!-- 실제 타일 -->
	{#if animator}
		<SpriteAnimatorRenderer {animator} {resolution} />
	{/if}
</div>
