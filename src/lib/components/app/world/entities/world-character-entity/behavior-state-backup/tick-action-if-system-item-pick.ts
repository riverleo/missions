import { useBehavior, useWorld, useInteraction } from '$lib/hooks';
import { produce } from 'immer';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { WorldItemId, Interaction, ItemInteraction } from '$lib/types';

/**
 * 시스템 아이템 줍기인 경우 실행
 *
 * 타겟 엔티티가 아이템이고 아직 들고 있지 않은 경우 줍기 인터렉션을 실행합니다.
 * system_interaction_type 줍기 인터렉션 체인을 진행하고, 완료 후 아이템을 들고 월드에서 제거합니다.
 *
 * @returns true: 진행 중, false: 완료 (다음 행동으로 전환)
 */
export default function tickActionIfSystemItemPick(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	const { getBehaviorAction } = useBehavior();
	const { getWorldItem, worldItemStore } = useWorld();
	const { getAllItemInteractions, getItemInteractionActions, getNextInteractionAction } =
		useInteraction();

	if (!this.behaviorTargetId) return false;
	const behaviorAction = getBehaviorAction(this.behaviorTargetId);

	// idle 타입이거나 타겟이 없으면 skip
	if (behaviorAction.type === 'idle' || !this.targetEntityId) return false;

	const worldCharacterEntity = this.worldCharacterEntity;
	const targetEntity = worldCharacterEntity.worldContext.entities[this.targetEntityId];

	// 타겟이 아이템이 아니면 skip
	if (!targetEntity || targetEntity.type !== 'item') return false;

	const worldItemId = targetEntity.instanceId as WorldItemId;
	const itemEntityId = targetEntity.id;

	// 이미 들고 있으면 skip
	if (worldCharacterEntity.heldItemIds.includes(itemEntityId)) {
		return false;
	}

	// worldItem 가져오기
	const worldItem = getWorldItem(worldItemId);
	if (!worldItem) {
		// worldItem이 없으면 skip
		return false;
	}

	// system_interaction_type이 'item_pick'인 인터렉션 찾기
	const allItemInteractions = getAllItemInteractions();
	const pickInteraction = allItemInteractions.find(
		(itemInteraction) =>
			itemInteraction.item_id === worldItem.item_id &&
			itemInteraction.system_interaction_type === 'item_pick'
	) as Interaction | undefined;

	if (!pickInteraction) {
		// 줍기 인터렉션이 없으면 즉시 줍기 (legacy behavior)
		worldCharacterEntity.heldItemIds.push(itemEntityId);
		targetEntity.removeFromWorld();

		worldItemStore.update((state) =>
			produce(state, (draft) => {
				draft.data[worldItemId] = {
					...worldItem,
					world_character_id: worldCharacterEntity.instanceId,
					world_building_id: null,
				};
			})
		);
		return false;
	}

	const itemInteraction = pickInteraction as ItemInteraction;

	// 1. 인터렉션 체인 시작 (아직 시작 안 했으면)
	if (!this.interactionTargetId) {
		const actions = getItemInteractionActions(itemInteraction.id);
		const rootAction = actions.find((a) => a.root);
		if (!rootAction) {
			// root action이 없으면 즉시 줍기
			worldCharacterEntity.heldItemIds.push(itemEntityId);
			targetEntity.removeFromWorld();

			worldItemStore.update((state) =>
				produce(state, (draft) => {
					draft.data[worldItemId] = {
						...worldItem,
						world_character_id: worldCharacterEntity.instanceId,
						world_building_id: null,
					};
				})
			);
			return false;
		}

		// 첫 번째 액션으로 체인 시작
		this.setInteractionTarget(
			InteractionIdUtils.create('item', itemInteraction.id, rootAction.id),
			tick
		);
		return true; // 진행 중
	}

	// 2. 인터렉션 체인 진행 (진행 중이면)
	if (this.interactionTargetId) {
		// duration_ticks 경과 확인
		const { interactionActionId } = InteractionIdUtils.parse(this.interactionTargetId);
		const interactionActions = getItemInteractionActions(itemInteraction.id);
		const currentInteractionAction = interactionActions.find((a) => a.id === interactionActionId);

		if (!currentInteractionAction) {
			throw new Error(
				`[tickActionIfSystemItemPick] Current interaction action not found: ${interactionActionId} in interaction ${itemInteraction.id}`
			);
		}

		const elapsed = tick - (this.interactionTargetStartTick ?? 0);

		if (elapsed < currentInteractionAction.duration_ticks) {
			return true; // 아직 실행 중
		}

		// 다음 인터렉션 액션으로 전환 또는 체인 종료
		const interactionAction = InteractionIdUtils.interactionAction.to(currentInteractionAction);
		const nextInteractionAction = getNextInteractionAction(interactionAction);

		if (nextInteractionAction) {
			// 다음 인터렉션으로 전환
			this.setInteractionTarget(InteractionIdUtils.create(nextInteractionAction), tick);
			return true; // 계속 진행
		} else {
			// 인터렉션 체인 종료 및 아이템 줍기
			this.clearInteractionTarget();

			// 아이템 줍기
			worldCharacterEntity.heldItemIds.push(itemEntityId);

			// 월드에서 제거
			targetEntity.removeFromWorld();

			// worldItem.world_character_id 업데이트
			worldItemStore.update((state) =>
				produce(state, (draft) => {
					draft.data[worldItemId] = {
						...worldItem,
						world_character_id: worldCharacterEntity.instanceId,
						world_building_id: null,
					};
				})
			);

			return false; // 완료
		}
	}

	// targetEntityId는 tickNextOrClear나 clear()에서 클리어됨
	return false;
}
