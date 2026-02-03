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
	if (!worldCharacterEntity.behavior.behaviorTargetId) return;

	const { type } = BehaviorIdUtils.parse(worldCharacterEntity.behavior.behaviorTargetId);
	const behaviorId = BehaviorIdUtils.behaviorId(worldCharacterEntity.behavior.behaviorTargetId);

	// 현재 액션 완료 시 path 클리어 (타겟은 유지)
	worldCharacterEntity.behavior.path = [];

	// 다음 액션 ID 가져오기
	const nextActionId =
		behaviorAction.behaviorType == 'need'
			? behaviorAction.next_need_behavior_action_id
			: behaviorAction.next_condition_behavior_action_id;

	if (nextActionId) {
		// 다음 액션으로 전환
		worldCharacterEntity.behavior.behaviorTargetId = BehaviorIdUtils.create(
			type,
			behaviorId,
			nextActionId
		);
		worldCharacterEntity.behavior.behaviorTargetStartTick = tick;
	} else {
		// 다음 액션이 없으면 행동 종료
		worldCharacterEntity.behavior.behaviorTargetId = undefined;
		worldCharacterEntity.behavior.behaviorTargetStartTick = 0;
	}
}
