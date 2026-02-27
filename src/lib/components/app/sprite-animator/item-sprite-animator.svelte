<script lang="ts">
	import { useItem } from '$lib/hooks';
	import type { ItemId, ItemStateType, LoopType } from '$lib/types';
	import type { HTMLAttributes } from 'svelte/elements';
	import { SpriteAnimator } from './sprite-animator.svelte';
	import SpriteAnimatorRenderer from './sprite-animator-renderer.svelte';
	import { cn } from '$lib/utils';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		itemId: ItemId;
		stateType: ItemStateType;
		resolution?: 1 | 2 | 3;
	}

	let {
		itemId,
		stateType,
		resolution = 1,
		class: className,
		...restProps
	}: Props = $props();

	const { itemStore, itemStateStore } = useItem();
	const item = $derived($itemStore.data[itemId]);
	const itemStates = $derived($itemStateStore.data[itemId] ?? []);
	const itemState = $derived(itemStates.find((s) => s.type === stateType));
	const scale = $derived(item?.scale ?? 1);

	let animator = $state<SpriteAnimator | undefined>(undefined);

	$effect(() => {
		const atlasName = itemState?.atlas_name;
		if (!atlasName) return;

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
				loop: (itemState.loop as LoopType) ?? 'loop',
			});
			animator = newAnimator;
		});

		return () => {
			animator?.stop();
		};
	});
</script>

<div
	{...restProps}
	class={cn('relative flex items-center justify-center', className)}
	style:transform={`scale(${scale})`}
>
	<!-- 실제 아이템 -->
	{#if animator}
		<SpriteAnimatorRenderer {animator} {resolution} />
	{/if}
</div>
