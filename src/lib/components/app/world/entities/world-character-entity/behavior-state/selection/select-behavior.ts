import { get } from 'svelte/store';
import type { Behavior } from '$lib/types';
import type { WorldCharacterEntity } from '../../world-character-entity.svelte';
import { useBehavior } from '$lib/hooks/use-behavior';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';

/**
 * 새로운 행동을 선택 (우선순위 기반)
 */
export default function selectNewBehavior(
	worldCharacterEntity: WorldCharacterEntity,
	tick: number
): void {
	const { getAllBehaviors, getAllBehaviorActions, behaviorPriorityStore } = useBehavior();

	// 1. 후보 behaviors 찾기
	const candidateBehaviors = getAllBehaviors().filter((behavior) => {
		if (behavior.behaviorType === 'need') {
			const need = worldCharacterEntity.needs[behavior.need_id];
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
		return;
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
	if (!selectedBehavior) return;

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
		return;
	}

	// 4. currentBehaviorId 설정 및 시작 tick 기록
	const actionId = rootAction.behaviorType === 'need' ? rootAction.id : rootAction.id;
	worldCharacterEntity.behaviorState.behaviorTargetId = BehaviorIdUtils.create(
		selectedBehavior.behaviorType,
		selectedBehavior.id,
		actionId
	);
	worldCharacterEntity.behaviorState.behaviorTargetStartTick = tick;
}
