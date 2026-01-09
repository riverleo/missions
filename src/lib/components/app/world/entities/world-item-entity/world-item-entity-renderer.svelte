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
	const { worldItemStore, selectedEntityIdStore } = useWorld();

	const worldItem = $derived($worldItemStore.data[entity.instanceId]);
	const item = $derived(worldItem ? $itemStore.data[worldItem.item_id] : undefined);
	const selected = $derived($selectedEntityIdStore.entityId === entity.id);

	// 디버그 모드일 때 opacity 낮춤
	const opacity = $derived(entity.debug ? 0.6 : 1);
</script>

{#if item}
	<!-- 아이템 스프라이트 -->
	<ItemSpriteAnimator
		itemId={item.id}
		stateType="idle"
		resolution={2}
		{selected}
		class="absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {entity.x + (item?.collider_offset_x ?? 0)}px; top: {entity.y +
			(item?.collider_offset_y ?? 0)}px; opacity: {opacity}; rotate: {entity.angle}rad;"
	/>
{/if}
