<script lang="ts">
	import { useCharacter, useItem, useWorld, useInteraction } from '$lib/hooks';
	import type { WorldCharacterEntity } from './world-character-entity.svelte';
	import type {
		ItemInteractionId,
		WorldItemId,
		CharacterBodyStateType,
		CharacterFaceStateType,
	} from '$lib/types';
	import { CharacterSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { InteractionIdUtils } from '$lib/utils/interaction-id';
	import { EntityIdUtils } from '$lib/utils/entity-id';

	interface Props {
		entity: WorldCharacterEntity;
	}

	let { entity }: Props = $props();

	const { characterStore, characterBodyStore } = useCharacter();
	const { worldCharacterStore, worldItemStore, selectedEntityIdStore } = useWorld();
	const { itemStore, itemStateStore } = useItem();
	const { itemInteractionActionStore } = useInteraction();

	const worldCharacter = $derived($worldCharacterStore.data[entity.instanceId]);
	const character = $derived(
		worldCharacter ? $characterStore.data[worldCharacter.character_id] : undefined
	);
	const characterBody = $derived(
		character ? $characterBodyStore.data[character.character_body_id] : undefined
	);
	const selected = $derived($selectedEntityIdStore.entityId === entity.id);

	// 캐릭터가 들고 있는 마지막 아이템의 상태 가져오기
	const heldItemState = $derived.by(() => {
		if (entity.heldItemIds.length === 0) return undefined;

		const lastHeldEntityId = entity.heldItemIds[entity.heldItemIds.length - 1];
		if (!lastHeldEntityId) return undefined;

		const { instanceId } = EntityIdUtils.parse(lastHeldEntityId);
		const worldItem = $worldItemStore.data[instanceId as WorldItemId];
		if (!worldItem) return undefined;

		const item = $itemStore.data[worldItem.item_id];
		if (!item) return undefined;

		const itemStates = $itemStateStore.data[item.id] ?? [];
		const itemState = itemStates.find((s) => s.type === 'idle');

		return itemState;
	});

	// InteractionAction의 아이템 transform 가져오기
	const heldItemTransform = $derived.by(() => {
		const currentInteractionTargetId = entity.behavior.interactionQueue.currentInteractionTargetId;

		// InteractionAction이 없으면 기본값
		if (!currentInteractionTargetId) {
			return { offset: { x: 0, y: 0 }, scale: 1, rotation: 0 };
		}

		// InteractionTargetId 파싱
		const { interactionActionId } = InteractionIdUtils.parse(currentInteractionTargetId);

		// ItemInteractionAction 조회
		for (const [interactionId, actions] of Object.entries($itemInteractionActionStore.data)) {
			const action = actions.find((a) => a.id === interactionActionId);
			if (action) {
				const transform = {
					offset: { x: action.item_offset_x ?? 0, y: action.item_offset_y ?? 0 },
					scale: action.item_scale ?? 1,
					rotation: action.item_rotation ?? 0,
				};
				return transform;
			}
		}

		return { offset: { x: 0, y: 0 }, scale: 1, rotation: 0 };
	});

	// 경로를 SVG path 문자열로 변환 (현재 위치에서 시작)
	const pathString = $derived.by(() => {
		if (entity.behavior.path.length === 0) return '';

		// 현재 캐릭터 위치에서 시작
		const points = [{ x: entity.x, y: entity.y }, ...entity.behavior.path];
		return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
	});

	// 디버그 모드일 때 opacity 낮춤
	const opacity = $derived(entity.debug ? 0.6 : 1);

	// bodyStateType 계산
	const bodyStateType = $derived.by((): CharacterBodyStateType => {
		// 경로가 있으면 walk
		if (entity.behavior.path.length > 0) return 'walk';

		// 인터렉션 중이면 interaction 상태
		if (entity.behavior.interactionQueue.currentInteractionTargetId) {
			// TODO: 인터렉션 타입에 따라 다른 상태 반환
			return 'idle';
		}

		// 기본값은 idle
		return 'idle';
	});

	// faceStateType 계산
	const faceStateType = $derived.by((): CharacterFaceStateType => {
		// 인터렉션 중이면 interaction 표정
		if (entity.behavior.interactionQueue.currentInteractionTargetId) {
			// TODO: 인터렉션 타입에 따라 다른 표정 반환
			return 'idle';
		}

		// 기본값은 idle
		return 'idle';
	});
</script>

{#if character}
	<!-- 경로 시각화는 월드 레벨에서 렌더링 -->
	{#if entity.behavior.path.length > 0}
		<svg class="absolute top-0 left-0 opacity-30" style="width: 100%; height: 100%;">
			<path d={pathString} stroke="white" stroke-width="1" fill="none" />
		</svg>
	{/if}

	<!-- 캐릭터 스프라이트 -->
	<CharacterSpriteAnimator
		characterId={character.id}
		{bodyStateType}
		{faceStateType}
		{heldItemState}
		heldItemOffset={heldItemTransform.offset}
		heldItemScale={heldItemTransform.scale}
		heldItemRotation={heldItemTransform.rotation}
		flip={entity.behavior.direction === 'right'}
		{selected}
		class="absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {entity.x + (characterBody?.collider_offset_x ?? 0)}px; top: {entity.y +
			(characterBody?.collider_offset_y ?? 0)}px; opacity: {opacity};"
	/>
{/if}
