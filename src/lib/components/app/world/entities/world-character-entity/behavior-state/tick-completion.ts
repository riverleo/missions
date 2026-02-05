import { useBehavior, useInteraction } from '$lib/hooks';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * 완료 체크 및 전환
 *
 * 매 tick마다 2단계 완료 체크를 수행합니다:
 * 1. 인터렉션 체인 완료 체크 (interactionTargetId)
 * 2. 행동 액션 완료 체크 (behaviorTargetId)
 */
export default function tickCompletion(
	this: WorldCharacterEntityBehavior,
	tick: number
): void {
	const { getBehaviorAction, getAllUsableBehaviors } = useBehavior();

	const worldCharacterEntity = this.worldCharacterEntity;
	const behaviorAction = getBehaviorAction(this.behaviorTargetId);
	if (!behaviorAction) return;

	// 1단계: 인터렉션 체인 완료 체크
	if (this.interactionTargetId) {
		const {
			getBuildingInteractionActions,
			getItemInteractionActions,
			getCharacterInteractionActions,
		} = useInteraction();

		// InteractionTargetId 파싱
		const { type, interactionId, interactionActionId } = InteractionIdUtils.parse(
			this.interactionTargetId
		);

		// 현재 인터렉션 액션 가져오기
		const buildingActions = getBuildingInteractionActions(interactionId as any);
		const itemActions = getItemInteractionActions(interactionId as any);
		const characterActions = getCharacterInteractionActions(interactionId as any);

		const allActions = [...buildingActions, ...itemActions, ...characterActions];
		const currentAction = allActions.find((a) => a.id === interactionActionId);

		if (!currentAction) return;

		// duration_ticks 경과 확인
		const elapsed = tick - (this.interactionTargetStartTick ?? 0);
		if (elapsed < currentAction.duration_ticks) {
			return; // 아직 실행 중
		}

		// 다음 인터렉션 액션으로 전환 또는 체인 종료
		const nextActionId =
			'next_building_interaction_action_id' in currentAction
				? currentAction.next_building_interaction_action_id
				: 'next_item_interaction_action_id' in currentAction
					? currentAction.next_item_interaction_action_id
					: 'next_character_interaction_action_id' in currentAction
						? currentAction.next_character_interaction_action_id
						: null;

		if (nextActionId) {
			// 다음 인터렉션으로 전환
			this.interactionTargetId = InteractionIdUtils.create(type, interactionId, nextActionId as any);
			this.interactionTargetStartTick = tick;
		} else {
			// 인터렉션 체인 종료
			this.interactionTargetId = undefined;
			this.interactionTargetStartTick = undefined;
		}

		return;
	}

	// 2단계: 행동 액션 완료 체크
	let isCompleted = false;

	if (behaviorAction.type === 'fulfill') {
		// FULFILL: 욕구/컨디션 충족 여부 확인
		const isNeedAction = behaviorAction.behaviorType === 'need';

		if (isNeedAction) {
			const { getAllNeedBehaviors } = useBehavior();
			const behavior = getAllNeedBehaviors().find((b) => b.need_id === behaviorAction.need_id);
			if (!behavior) return;

			const need = worldCharacterEntity.needs[behaviorAction.need_id];
			if (!need) return;

			// 욕구가 threshold를 넘으면 완료
			isCompleted = need.value > behavior.need_threshold;
		} else {
			// TODO: Condition 충족 확인
			isCompleted = false;
		}
	} else if (behaviorAction.type === 'idle') {
		// IDLE: idle_duration_ticks 경과 확인
		isCompleted =
			tick - (this.behaviorTargetStartTick ?? 0) >= behaviorAction.idle_duration_ticks;
	}

	// 완료되지 않았으면 종료
	if (!isCompleted) return;

	// 다음 행동 액션으로 전환
	if (!this.behaviorTargetId) return;

	const { type } = BehaviorIdUtils.parse(this.behaviorTargetId);
	const behaviorId = BehaviorIdUtils.behaviorId(this.behaviorTargetId);

	// path 클리어 (타겟은 유지)
	this.path = [];

	// 다음 액션 ID 가져오기
	const nextActionId =
		behaviorAction.behaviorType === 'need'
			? behaviorAction.next_need_behavior_action_id
			: behaviorAction.next_condition_behavior_action_id;

	if (nextActionId) {
		// 다음 액션으로 전환
		this.behaviorTargetId = BehaviorIdUtils.create(type, behaviorId, nextActionId);
		this.behaviorTargetStartTick = tick;
		this.clearTargetEntity();
	} else {
		// 다음 액션이 없으면 행동 종료
		this.behaviorTargetId = undefined;
		this.behaviorTargetStartTick = undefined;
		this.clearTargetEntity();
	}
}
