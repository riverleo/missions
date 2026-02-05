import { useBehavior } from '$lib/hooks';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * 다음 행동 액션으로 전환 또는 종료
 *
 * 현재 행동 액션이 완료되면 다음 행동 액션으로 전환하거나 행동을 종료합니다.
 * 완료 여부는 각 tick 메서드에서 판단하며, 이 메서드는 전환/종료만 수행합니다.
 */
export default function tickNextOrClear(
	this: WorldCharacterEntityBehavior,
	tick: number
): void {
	const { getBehaviorAction } = useBehavior();

	const behaviorAction = getBehaviorAction(this.behaviorTargetId);
	if (!behaviorAction) return;

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
		// 다음 액션이 없으면 행동 완전히 종료
		this.clear();
	}
}
