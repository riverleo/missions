<script lang="ts">
	import type { WorldItemEntity } from './world-item-entity.svelte';
	import type { ItemInteractionActionId } from '$lib/types';
	import { useItem } from '$lib/hooks/use-item';
	import { useWorld } from '$lib/hooks/use-world';
	import { ItemSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { EntityIdUtils } from '$lib/utils/entity-id';

	interface Props {
		entity: WorldItemEntity;
	}

	let { entity }: Props = $props();

	const { itemStore, itemInteractionActionStore } = useItem();
	const { worldItemStore, selectedEntityIdStore } = useWorld();

	const worldItem = $derived($worldItemStore.data[entity.instanceId]);
	const item = $derived(worldItem ? $itemStore.data[worldItem.item_id] : undefined);
	const selected = $derived($selectedEntityIdStore.entityId === entity.id);

	// 디버그 모드일 때 opacity 낮춤
	const opacity = $derived(entity.debug ? 0.6 : 1);

	// InteractionAction 중 transform 적용
	const interactionTransform = $derived.by(() => {
		// 아이템이 캐릭터에게 속해있는지 확인
		if (!worldItem || !worldItem.world_character_id) {
			return { offsetX: 0, offsetY: 0, rotation: 0, scale: 1 };
		}

		// 해당 캐릭터 찾기
		const characterEntityId = EntityIdUtils.createId(
			'character',
			entity.worldContext.worldId,
			worldItem.world_character_id
		);
		const characterEntity = entity.worldContext.entities[characterEntityId];
		if (!characterEntity || characterEntity.type !== 'character') {
			return { offsetX: 0, offsetY: 0, rotation: 0, scale: 1 };
		}

		// 캐릭터의 현재 InteractionAction 확인
		const interactionActionId = characterEntity.currentInteractionActionId;
		if (!interactionActionId) {
			return { offsetX: 0, offsetY: 0, rotation: 0, scale: 1 };
		}

		// ItemInteractionAction 조회
		if (item) {
			const itemInteractions = Object.values($itemInteractionActionStore.data);
			for (const [interactionId, actions] of Object.entries($itemInteractionActionStore.data)) {
				const action = actions.find((a) => a.id === interactionActionId);
				if (action) {
					return {
						offsetX: action.item_offset_x ?? 0,
						offsetY: action.item_offset_y ?? 0,
						rotation: action.item_rotation ?? 0,
						scale: action.item_scale ?? 1,
					};
				}
			}
		}

		return { offsetX: 0, offsetY: 0, rotation: 0, scale: 1 };
	});
</script>

{#if item}
	<!-- 아이템 스프라이트 -->
	<ItemSpriteAnimator
		itemId={item.id}
		stateType="idle"
		resolution={2}
		{selected}
		class="absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {entity.x +
			(item?.collider_offset_x ?? 0) +
			interactionTransform.offsetX}px; top: {entity.y +
			(item?.collider_offset_y ?? 0) +
			interactionTransform.offsetY}px; opacity: {opacity}; rotate: {entity.angle +
			interactionTransform.rotation}rad; scale: {interactionTransform.scale};"
	/>
{/if}
