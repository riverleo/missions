<script lang="ts">
	import type { WorldItemEntity } from './world-item-entity.svelte';
	import { useItem } from '$lib/hooks/use-item';
	import { useWorld } from '$lib/hooks/use-world';
	import { ItemSpriteAnimator } from '$lib/components/app/sprite-animator';

	interface Props {
		entity: WorldItemEntity;
	}

	let { entity }: Props = $props();

	const { store: itemStore } = useItem();
	const { worldItemStore, selectedEntityStore } = useWorld();

	const worldItem = $derived($worldItemStore.data[entity.id]);
	const item = $derived(worldItem ? $itemStore.data[worldItem.item_id] : undefined);
	const selected = $derived($selectedEntityStore.entityId === entity.toEntityId());
</script>

{#if item}
	<div
		class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {entity.x}px; top: {entity.y}px; rotate: {entity.angle}rad;"
	>
		<ItemSpriteAnimator itemId={item.id} stateType="idle" resolution={2} {selected} />
	</div>
{/if}
