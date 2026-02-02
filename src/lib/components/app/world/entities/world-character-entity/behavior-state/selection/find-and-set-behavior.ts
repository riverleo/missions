import { get } from 'svelte/store';
import type { WorldCharacterEntityBehaviorState } from '../world-character-entity-behavior-state.svelte';
import { useBehavior } from '$lib/hooks/use-behavior';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';

/**
 * 새로운 행동을 선택 (우선순위 기반)
 */
export default function findAndSetBehavior(
	this: WorldCharacterEntityBehaviorState,
	tick: number
): boolean {
	const { getAllBehaviors, getAllBehaviorActions, behaviorPriorityStore, getBehaviorAction } =
		useBehavior();

	// 이미 행동이 설정되어 있으면 유효성 검증
	if (this.behaviorTargetId) {
		const behaviorAction = getBehaviorAction(this.behaviorTargetId);
		if (!behaviorAction) {
			// 액션을 찾을 수 없으면 행동 종료
			this.behaviorTargetId = undefined;
			return false;
		}
		return true;
	}

	// 1. 후보 behaviors 찾기
	const candidateBehaviors = getAllBehaviors().filter((behavior) => {
		if (behavior.behaviorType === 'need') {
			const need = this.worldCharacterEntity.needs[behavior.need_id];
			if (!need) return false;
			// 욕구 레벨이 threshold 이하이면 발동
			return need.value <= behavior.need_threshold;
		} else {
			// TODO: 컨디션 조건 체크 로직 (나중에 구현)
			return false;
		}
	});

	if (candidateBehaviors.length === 0) {
		// 후보가 없으면 종료
		return false;
	}

	// 2. 우선순위에 따라 정렬
	const priorities = get(behaviorPriorityStore).data;
	const sortedCandidates = candidateBehaviors.sort((a, b) => {
		const priorityA = Object.values(priorities).find((p) =>
			a.behaviorType === 'need' ? p.need_behavior_id === a.id : p.condition_behavior_id === a.id
		);
		const priorityB = Object.values(priorities).find((p) =>
			b.behaviorType === 'need' ? p.need_behavior_id === b.id : p.condition_behavior_id === b.id
		);

		const valA = priorityA?.priority ?? 0;
		const valB = priorityB?.priority ?? 0;

		// 높은 우선순위가 먼저 오도록 내림차순 정렬
		return valB - valA;
	});

	const selectedBehavior = sortedCandidates[0];
	if (!selectedBehavior) return false;

	// 3. root action 찾기
	const allBehaviorActions = getAllBehaviorActions();
	const rootAction = allBehaviorActions.find((action) => {
		if (selectedBehavior.behaviorType === 'need') {
			return (
				action.behaviorType === 'need' && action.behavior_id === selectedBehavior.id && action.root
			);
		} else {
			return (
				action.behaviorType === 'condition' &&
				action.condition_behavior_id === selectedBehavior.id &&
				action.root
			);
		}
	});

	if (!rootAction) {
		// root action이 없으면 종료
		return false;
	}

	// 4. currentBehaviorId 설정 및 시작 tick 기록
	const actionId = rootAction.behaviorType === 'need' ? rootAction.id : rootAction.id;
	this.behaviorTargetId = BehaviorIdUtils.create(
		selectedBehavior.behaviorType,
		selectedBehavior.id,
		actionId
	);
	this.behaviorTargetStartTick = tick;

	// 5. 생성된 BehaviorAction 유효성 검증
	const behaviorAction = getBehaviorAction(this.behaviorTargetId);
	if (!behaviorAction) {
		// 액션을 찾을 수 없으면 행동 종료
		this.behaviorTargetId = undefined;
		return false;
	}

	return true;
}
