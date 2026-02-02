import type { BehaviorAction } from '$lib/types';
import type { WorldCharacterEntity } from '../../world-character-entity.svelte';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';

/**
 * 다음 액션으로 전환
 */
export default function transitionToNextAction(
	worldCharacterEntity: WorldCharacterEntity,
	behaviorAction: BehaviorAction,
	tick: number
): void {
	if (!worldCharacterEntity.behaviorState.behaviorTargetId) return;

	const { type } = BehaviorIdUtils.parse(worldCharacterEntity.behaviorState.behaviorTargetId);
	const behaviorId = BehaviorIdUtils.behaviorId(worldCharacterEntity.behaviorState.behaviorTargetId);

	// 현재 액션 완료 시 path 클리어 (타겟은 유지)
	worldCharacterEntity.behaviorState.path = [];

	// 다음 액션 ID 가져오기
	const nextActionId =
		behaviorAction.behaviorType == 'need'
			? behaviorAction.next_need_behavior_action_id
			: behaviorAction.next_condition_behavior_action_id;

	if (nextActionId) {
		// 다음 액션으로 전환
		worldCharacterEntity.behaviorState.behaviorTargetId = BehaviorIdUtils.create(
			type,
			behaviorId,
			nextActionId
		);
		worldCharacterEntity.behaviorState.behaviorTargetStartTick = tick;
	} else {
		// 다음 액션이 없으면 행동 종료
		worldCharacterEntity.behaviorState.behaviorTargetId = undefined;
		worldCharacterEntity.behaviorState.behaviorTargetStartTick = 0;
	}
}
