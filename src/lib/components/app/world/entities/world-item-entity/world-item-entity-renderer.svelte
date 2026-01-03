<script lang="ts">
	import type { WorldItemEntity } from './world-item-entity.svelte';
	import { useItem } from '$lib/hooks/use-item';
	import { useWorld } from '$lib/hooks/use-world';
	import { ItemSpriteAnimator } from '$lib/components/app/sprite-animator';

	interface Props {
		entity: WorldItemEntity;
	}

	let { entity }: Props = $props();

	const { store: itemStore, stateStore: itemStateStore } = useItem();
	const { worldItemStore, selectedEntityStore } = useWorld();

	const worldItem = $derived($worldItemStore.data[entity.id]);
	const item = $derived(worldItem ? $itemStore.data[worldItem.item_id] : undefined);
	const itemStates = $derived(item ? ($itemStateStore.data[item.id] ?? []) : []);
	const itemState = $derived(itemStates.find((s) => s.type === 'idle'));
	const selected = $derived(
		$selectedEntityStore.entityId?.value === entity.id &&
			$selectedEntityStore.entityId?.type === 'item'
	);
</script>

{#if itemState}
	<div
		class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {entity.x}px; top: {entity.y}px; rotate: {entity.angle}rad;"
	>
		<ItemSpriteAnimator {itemState} resolution={2} {selected} />
	</div>
{/if}
