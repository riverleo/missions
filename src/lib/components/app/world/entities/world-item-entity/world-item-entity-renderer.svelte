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

	// 디버그 모드일 때 opacity 낮춤
	const opacity = $derived(entity.debug ? 0.6 : 1);

	// wrapper 크기 (circle 타입은 width만 사용)
	const wrapperWidth = $derived(entity.width);
	const wrapperHeight = $derived(item?.collider_type === 'circle' ? entity.width : entity.height);
</script>

{#if item}
	<!-- 바디 크기 wrapper -->
	<div
		class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {entity.x}px; top: {entity.y}px; width: {wrapperWidth}px; height: {wrapperHeight}px;"
	>
		<!-- 스프라이트: wrapper 내부에서 bottom-center 기준 -->
		<div
			class="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-full"
			style="left: {item?.collider_offset_x ?? 0}px; bottom: {item?.collider_offset_y ?? 0}px; opacity: {opacity}; rotate: {entity.angle}rad;"
		>
			<ItemSpriteAnimator itemId={item.id} stateType="idle" resolution={2} {selected} />
		</div>
	</div>
{/if}
