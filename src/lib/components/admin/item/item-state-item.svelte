<script lang="ts">
	import type { ItemStateType } from '$lib/types';
	import type { ItemId, ItemState } from '$lib/types';
	import SpriteStateItem, {
		type SpriteStateChange,
	} from '$lib/components/admin/sprite-state-item.svelte';
	import ItemSpriteAnimator from '$lib/components/app/sprite-animator/item-sprite-animator.svelte';
	import { useItem } from '$lib/hooks/use-item';
	import { getItemStateLabel } from '$lib/utils/state-label';

	interface Props {
		itemId: string;
		type: ItemStateType;
	}

	let { itemId, type }: Props = $props();

	const { store, stateStore, admin } = useItem();
	const { uiStore } = admin;

	const item = $derived($store.data[itemId as ItemId]);
	const itemStates = $derived($stateStore.data[itemId as ItemId] ?? []);
	const itemState = $derived(itemStates.find((s) => s.type === type));

	async function onchange(change: SpriteStateChange) {
		if (itemState) {
			await admin.updateItemState(itemState.id, itemId as ItemId, change);
		} else if (change.atlas_name) {
			await admin.createItemState(itemId as ItemId, { type, atlas_name: change.atlas_name });
		}
	}

	async function ondelete() {
		if (itemState) {
			await admin.removeItemState(itemState.id, itemId as ItemId);
		}
	}
</script>

<SpriteStateItem
	{type}
	label={getItemStateLabel(type)}
	spriteState={itemState}
	{onchange}
	{ondelete}
>
	{#snippet preview()}
		<ItemSpriteAnimator itemId={itemId as ItemId} stateType={type} resolution={2} />
	{/snippet}
	{#snippet collider()}
		{#if $uiStore.showBodyPreview && item && (item.collider_width > 0 || item.collider_height > 0)}
			<svg
				width={item.collider_width}
				height={item.collider_height}
				style="transform: translate({-item.collider_offset_x}px, {-item.collider_offset_y}px);"
			>
				{#if item.collider_type === 'circle'}
					<circle
						cx={item.collider_width / 2}
						cy={item.collider_height / 2}
						r={item.collider_width / 2}
						fill="rgba(255, 255, 0, 0.5)"
					/>
				{:else}
					<rect width={item.collider_width} height={item.collider_height} fill="rgba(255, 255, 0, 0.5)" />
				{/if}
			</svg>
		{/if}
	{/snippet}
</SpriteStateItem>
