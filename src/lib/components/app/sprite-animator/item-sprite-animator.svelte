<script lang="ts">
	import type { ItemId, ItemStateType, LoopMode } from '$lib/types';
	import { SpriteAnimator } from './sprite-animator.svelte';
	import SpriteAnimatorRenderer from './sprite-animator-renderer.svelte';
	import { useItem } from '$lib/hooks/use-item';

	const OUTLINE_WIDTH = 10;

	interface Props {
		itemId: ItemId;
		stateType: ItemStateType;
		resolution?: 1 | 2 | 3;
		selected?: boolean;
	}

	let { itemId, stateType, resolution = 1, selected = false }: Props = $props();

	const { store, stateStore } = useItem();
	const item = $derived($store.data[itemId]);
	const itemStates = $derived($stateStore.data[itemId] ?? []);
	const itemState = $derived(itemStates.find((s) => s.type === stateType));
	const scale = $derived(item?.scale ?? 1);

	$effect(() => {
		console.log('[ItemSpriteAnimator] itemId:', itemId, 'scale:', scale, 'item:', item);
	});

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
				loop: (itemState.loop as LoopMode) ?? 'loop',
			});
			animator = newAnimator;
		});

		return () => {
			animator?.stop();
		};
	});
</script>

<div class="relative inline-flex items-center justify-center" style:transform={`scale(${scale})`}>
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

	<!-- 실제 아이템 -->
	{#if animator}
		<SpriteAnimatorRenderer {animator} {resolution} />
	{/if}
</div>
