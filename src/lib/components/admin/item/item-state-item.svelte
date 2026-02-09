<script lang="ts">
	import { useItem } from '$lib/hooks';
	import type { ItemStateType } from '$lib/types';
	import type { ItemId, ItemState } from '$lib/types';
	import SpriteStateItem, {
		type SpriteStateChange,
	} from '$lib/components/admin/sprite-state-item.svelte';
	import ItemSpriteAnimator from '$lib/components/app/sprite-animator/item-sprite-animator.svelte';
	import { getFallbackString, getItemStateString } from '$lib/utils/label';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		itemId: ItemId;
		type: ItemStateType;
	}

	let { itemId, type }: Props = $props();

	const { getOrUndefinedItem, getItemStates, admin, openStateDialog } = useItem();
	const { itemUiStore } = admin;

	const item = $derived(getOrUndefinedItem(itemId));
	const itemStates = $derived(getItemStates(itemId) ?? []);
	const itemState = $derived(itemStates.find((s) => s.type === type));

	const durabilityPreview = $derived.by(() => {
		if (type === 'idle') return undefined;

		if (!itemState) return undefined;

		if (!item?.max_durability_ticks) return getFallbackString('noDurability');

		return `내구도 ${itemState.min_durability.toLocaleString()}~${itemState.max_durability.toLocaleString()} 틱 사이`;
	});

	async function onchange(change: SpriteStateChange) {
		if (itemState) {
			await admin.updateItemState(itemState.id, itemId, change);
		} else if (change.atlas_name) {
			await admin.createItemState(itemId, { type, atlas_name: change.atlas_name });
		}
	}

	async function ondelete() {
		if (itemState) {
			await admin.removeItemState(itemState.id, itemId);
		}
	}

	function onDurabilityClick() {
		if (itemState) {
			openStateDialog({ type: 'update', itemStateId: itemState.id });
		}
	}
</script>

<SpriteStateItem
	{type}
	label={getItemStateString(type)}
	spriteState={itemState}
	{onchange}
	{ondelete}
>
	{#snippet preview()}
		<ItemSpriteAnimator {itemId} stateType={type} resolution={2} />
	{/snippet}
	{#snippet collider()}
		{#if $itemUiStore.showBodyPreview && item && (item.collider_width > 0 || item.collider_height > 0)}
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
					<rect
						width={item.collider_width}
						height={item.collider_height}
						fill="rgba(255, 255, 0, 0.5)"
					/>
				{/if}
			</svg>
		{/if}
	{/snippet}
	{#snippet action()}
		{#if durabilityPreview !== undefined}
			<Button
				variant="ghost"
				size="sm"
				disabled={!itemState || type === 'idle' || !item?.max_durability_ticks}
				onclick={onDurabilityClick}
			>
				{durabilityPreview}
			</Button>
		{/if}
	{/snippet}
</SpriteStateItem>
