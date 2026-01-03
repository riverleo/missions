<script lang="ts">
	import type { WorldItemEntity } from './world-item-entity.svelte';
	import { useItem } from '$lib/hooks/use-item';
	import { useWorld } from '$lib/hooks/use-world';

	interface Props {
		entity: WorldItemEntity;
	}

	let { entity }: Props = $props();

	const { store: itemStore } = useItem();
	const { worldItemStore, selectedEntityStore } = useWorld();

	const worldItem = $derived($worldItemStore.data[entity.id]);
	const item = $derived(worldItem ? $itemStore.data[worldItem.item_id] : undefined);
	const selected = $derived(
		$selectedEntityStore.entityId?.value === entity.id &&
			$selectedEntityStore.entityId?.type === 'item'
	);
</script>

{#if item}
	<div
		class="pointer-events-none absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2 rounded"
		class:ring-2={selected}
		class:ring-white={selected}
		style="left: {entity.x}px; top: {entity.y}px; width: 32px; height: 32px; rotate: {entity.angle}rad;"
	>
		<span class="text-xs font-bold text-white">{item.name.charAt(0)}</span>
	</div>
{/if}
