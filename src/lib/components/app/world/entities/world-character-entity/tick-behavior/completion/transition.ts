import type { WorldCharacterEntity } from '../../world-character-entity.svelte';
import { BehaviorActionIdUtils } from '$lib/utils/behavior-action-id';

/**
 * 다음 액션으로 전환
 */
export default function transitionToNextAction(
	entity: WorldCharacterEntity,
	action: any,
	currentTick: number
): void {
	if (!entity.currentBehaviorActionId) return;

	const { type } = BehaviorActionIdUtils.parse(entity.currentBehaviorActionId);
	const behaviorId = BehaviorActionIdUtils.behaviorId(entity.currentBehaviorActionId);

	// 현재 액션 완료 시 path와 타겟 클리어
	entity.path = [];
	entity.currentTargetEntityId = undefined;

	// 다음 액션 ID 가져오기
	const nextActionId =
		type === 'need'
			? action.next_need_behavior_action_id
			: action.next_condition_behavior_action_id;

	if (nextActionId) {
		// 다음 액션으로 전환
		entity.currentBehaviorActionId = BehaviorActionIdUtils.create(type, behaviorId, nextActionId);
		entity.actionStartTick = currentTick;
	} else {
		// 다음 액션이 없으면 행동 종료
		entity.currentBehaviorActionId = undefined;
		entity.actionStartTick = 0;
	}
}
