import { useBehavior, useWorld, useInteraction, useCharacter } from '$lib/hooks';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import { EntityIdUtils } from '$lib/utils/entity-id';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { WorldItemId, ItemInteractionId } from '$lib/types';

/**
 * 아이템 사용 인터렉션 (fulfill)
 *
 * fulfill_interaction_type이 아이템 사용인 경우 아이템 사용 인터렉션을 실행합니다.
 * 사용 인터렉션 진행 중 need_fulfilments, condition_fulfillments를 실행합니다.
 *
 * @returns true: 행동 실행 중단, false: 행동 실행 계속 진행
 */
export default function tickActionFulfillItemUse(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	const { getBehaviorAction } = useBehavior();
	const { getInteraction, getWorldItem } = useWorld();
	const { getItemInteractionActions, getItemInteraction, getNextInteractionActionId } =
		useInteraction();
	const { getAllNeedFulfillments } = useCharacter();

	const worldCharacterEntity = this.worldCharacterEntity;
	const behaviorAction = getBehaviorAction(this.behaviorTargetId);
	if (!behaviorAction) return false;

	// fulfill 타입이 아니면 skip
	if (behaviorAction.type !== 'fulfill') return false;

	const interaction = getInteraction(behaviorAction);
	if (!interaction) return false;

	// fulfill_interaction_type 확인 (item만 처리)
	if (!('item_interaction_id' in interaction)) return false;

	// 들고 있는 아이템 확인
	if (worldCharacterEntity.heldItemIds.length === 0) return false;

	const lastHeldEntityId =
		worldCharacterEntity.heldItemIds[worldCharacterEntity.heldItemIds.length - 1];
	if (!lastHeldEntityId) return false;

	const { instanceId } = EntityIdUtils.parse(lastHeldEntityId);
	const worldItem = getWorldItem(instanceId as WorldItemId);
	if (!worldItem) return false;

	// 아이템의 인터렉션 가져오기
	if (!('item_interaction_id' in interaction)) return false;
	const itemInteraction = getItemInteraction(interaction.item_interaction_id as ItemInteractionId);
	if (!itemInteraction) return false;

	// 1. 인터렉션 체인 시작 (아직 시작 안 했으면)
	if (!this.interactionTargetId) {
		const actions = getItemInteractionActions(itemInteraction.id);
		const rootAction = actions.find((a) => a.root);
		if (!rootAction) return false;

		// 첫 번째 액션으로 체인 시작
		this.interactionTargetId = InteractionIdUtils.create('item', itemInteraction.id, rootAction.id);
		this.interactionTargetStartTick = tick;
	}

	// 2. 인터렉션 체인 진행 (진행 중이면)
	if (this.interactionTargetId) {
		// need_fulfilments 실행 (매 tick마다 욕구 증가)
		const needFulfillments = getAllNeedFulfillments().filter(
			(nf) => nf.item_interaction_id === itemInteraction.id
		);

		for (const needFulfillment of needFulfillments) {
			const need = worldCharacterEntity.needs[needFulfillment.need_id];
			if (!need) continue;

			// 욕구 증가
			need.value = Math.min(100, need.value + needFulfillment.increase_per_tick);
		}

		// duration_ticks 경과 확인
		const { interactionActionId } = InteractionIdUtils.parse(this.interactionTargetId);
		const actions = getItemInteractionActions(itemInteraction.id);
		const currentAction = actions.find((a) => a.id === interactionActionId);

		if (!currentAction) return true; // 액션 못 찾으면 대기

		const elapsed = tick - (this.interactionTargetStartTick ?? 0);
		if (elapsed < currentAction.duration_ticks) {
			return true; // 아직 실행 중
		}

		// 다음 인터렉션 액션으로 전환 또는 체인 종료
		const nextActionId = getNextInteractionActionId(currentAction);

		if (nextActionId) {
			// 다음 인터렉션으로 전환
			this.interactionTargetId = InteractionIdUtils.create(
				'item',
				itemInteraction.id,
				nextActionId as any
			);
			this.interactionTargetStartTick = tick;
			return true; // 계속 진행
		} else {
			// 인터렉션 체인 종료
			this.interactionTargetId = undefined;
			this.interactionTargetStartTick = undefined;
			// return false로 tickActionSystemPost에서 아이템 제거
		}
	}

	// 3. 인터렉션 끝났으면 tickActionSystemPost로 (아이템 제거)
	return false;
}
