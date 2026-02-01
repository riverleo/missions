import type { BehaviorAction } from '$lib/types';
import type { WorldCharacterEntity } from '../../world-character-entity.svelte';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';

/**
 * 다음 액션으로 전환
 */
export default function transitionToNextAction(
	entity: WorldCharacterEntity,
	action: BehaviorAction,
	currentTick: number
): void {
	if (!entity.currentBehaviorTargetId) return;

	const { type } = BehaviorIdUtils.parse(entity.currentBehaviorTargetId);
	const behaviorId = BehaviorIdUtils.behaviorId(entity.currentBehaviorTargetId);

	// 현재 액션 완료 시 path 클리어 (타겟은 유지)
	entity.path = [];

	// 다음 액션 ID 가져오기
	const nextActionId =
		'next_need_behavior_action_id' in action
			? action.next_need_behavior_action_id
			: action.next_condition_behavior_action_id;

	if (nextActionId) {
		// 다음 액션으로 전환
		entity.currentBehaviorTargetId = BehaviorIdUtils.create(type, behaviorId, nextActionId);
		entity.behaviorActionStartTick = currentTick;
	} else {
		// 다음 액션이 없으면 행동 종료
		entity.currentBehaviorTargetId = undefined;
		entity.behaviorActionStartTick = 0;
	}
}
