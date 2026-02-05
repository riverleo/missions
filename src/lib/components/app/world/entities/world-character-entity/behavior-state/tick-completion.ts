import { useBehavior } from '$lib/hooks';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * 행동 액션 완료 체크 및 전환
 *
 * 행동 액션의 완료 여부를 확인하고 다음 행동 액션으로 전환합니다.
 * - IDLE: idle_duration_ticks 경과 확인
 * - FULFILL: need threshold 달성 확인
 */
export default function tickCompletion(
	this: WorldCharacterEntityBehavior,
	tick: number
): void {
	const { getBehaviorAction } = useBehavior();

	const worldCharacterEntity = this.worldCharacterEntity;
	const behaviorAction = getBehaviorAction(this.behaviorTargetId);
	if (!behaviorAction) return;

	// 행동 액션 완료 체크
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
