<script lang="ts">
	import type { WorldCharacterEntity } from './world-character-entity.svelte';
	import type { ItemInteractionId } from '$lib/types';
	import { CharacterSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useWorld } from '$lib/hooks/use-world';
	import { useItem } from '$lib/hooks/use-item';
	import { InteractionIdUtils } from '$lib/utils/interaction-id';

	interface Props {
		entity: WorldCharacterEntity;
	}

	let { entity }: Props = $props();

	const { characterStore, characterBodyStore } = useCharacter();
	const { worldCharacterStore, worldItemStore, selectedEntityIdStore } = useWorld();
	const { itemStore, itemStateStore, itemInteractionActionStore } = useItem();

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

		const lastHeldItemId = entity.heldItemIds[entity.heldItemIds.length - 1];
		if (!lastHeldItemId) return undefined;

		const worldItem = $worldItemStore.data[lastHeldItemId];
		if (!worldItem) return undefined;

		const item = $itemStore.data[worldItem.item_id];
		if (!item) return undefined;

		const itemStates = $itemStateStore.data[item.id] ?? [];
		const itemState = itemStates.find((s) => s.type === 'idle');

		return itemState;
	});

	// InteractionAction의 아이템 transform 가져오기
	const heldItemTransform = $derived.by(() => {
		// InteractionAction이 없으면 기본값
		if (!entity.behaviorState.interactionTargetId) {
			return { offset: { x: 0, y: 0 }, scale: 1, rotation: 0 };
		}

		// InteractionTargetId 파싱
		const { interactionActionId } = InteractionIdUtils.parse(
			entity.behaviorState.interactionTargetId
		);
		console.log('[CharacterRenderer] Looking for InteractionAction:', interactionActionId);
		console.log(
			'[CharacterRenderer] ItemInteractionActionStore keys:',
			Object.keys($itemInteractionActionStore.data)
		);

		// ItemInteractionAction 조회
		for (const [interactionId, actions] of Object.entries($itemInteractionActionStore.data)) {
			console.log(
				`[CharacterRenderer] Checking interaction ${interactionId}, actions:`,
				actions.map((a) => ({
					id: a.id,
					offset_x: a.item_offset_x,
					offset_y: a.item_offset_y,
					scale: a.item_scale,
					rotation: a.item_rotation,
				}))
			);
			const action = actions.find((a) => a.id === interactionActionId);
			if (action) {
				console.log('[CharacterRenderer] Found action:', {
					id: action.id,
					item_offset_x: action.item_offset_x,
					item_offset_y: action.item_offset_y,
					item_scale: action.item_scale,
					item_rotation: action.item_rotation,
				});
				const transform = {
					offset: { x: action.item_offset_x ?? 0, y: action.item_offset_y ?? 0 },
					scale: action.item_scale ?? 1,
					rotation: action.item_rotation ?? 0,
				};
				console.log('[CharacterRenderer] Applying transform:', transform);
				return transform;
			}
		}

		console.log('[CharacterRenderer] No matching action found, using defaults');
		return { offset: { x: 0, y: 0 }, scale: 1, rotation: 0 };
	});

	// 경로를 SVG path 문자열로 변환 (현재 위치에서 시작)
	const pathString = $derived.by(() => {
		if (entity.behaviorState.path.length === 0) return '';

		// 현재 캐릭터 위치에서 시작
		const points = [{ x: entity.x, y: entity.y }, ...entity.behaviorState.path];
		return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
	});

	// 디버그 모드일 때 opacity 낮춤
	const opacity = $derived(entity.debug ? 0.6 : 1);
</script>

{#if character}
	<!-- 경로 시각화는 월드 레벨에서 렌더링 -->
	{#if entity.behaviorState.path.length > 0}
		<svg class="absolute top-0 left-0 opacity-30" style="width: 100%; height: 100%;">
			<path d={pathString} stroke="white" stroke-width="1" fill="none" />
		</svg>
	{/if}

	<!-- 캐릭터 스프라이트 -->
	<CharacterSpriteAnimator
		characterId={character.id}
		bodyStateType="idle"
		faceStateType="idle"
		{heldItemState}
		heldItemOffset={heldItemTransform.offset}
		heldItemScale={heldItemTransform.scale}
		heldItemRotation={heldItemTransform.rotation}
		flip={entity.behaviorState.direction === 'right'}
		{selected}
		class="absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {entity.x + (characterBody?.collider_offset_x ?? 0)}px; top: {entity.y +
			(characterBody?.collider_offset_y ?? 0)}px; opacity: {opacity};"
	/>
{/if}
