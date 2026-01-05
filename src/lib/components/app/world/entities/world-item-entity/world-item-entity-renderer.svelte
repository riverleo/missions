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

	const worldItem = $derived($worldItemStore.data[entity.id]);
	const item = $derived(worldItem ? $itemStore.data[worldItem.item_id] : undefined);
	const selected = $derived($selectedEntityIdStore.entityId === entity.toEntityId());

	// 스프라이트 위치 계산 (바디 바닥 = 스프라이트 바닥)
	const spriteX = $derived(entity.x + (item?.collider_offset_x ?? 0));
	const spriteY = $derived(entity.y + entity.height / 2 + (item?.collider_offset_y ?? 0));

	// 디버그 모드일 때 opacity 낮춤
	const opacity = $derived(entity.debug ? 0.6 : 1);
</script>

{#if item}
	<ItemSpriteAnimator
		itemId={item.id}
		stateType="idle"
		resolution={2}
		{selected}
		class="pointer-events-none absolute -translate-x-1/2 -translate-y-full"
		style="left: {spriteX}px; top: {spriteY}px; rotate: {entity.angle}rad; opacity: {opacity};"
	/>
{/if}
