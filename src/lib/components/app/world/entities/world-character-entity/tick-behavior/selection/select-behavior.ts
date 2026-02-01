import { get } from 'svelte/store';
import type { NeedBehaviorId, ConditionBehaviorId, ConditionBehavior } from '$lib/types';
import type { WorldCharacterEntity } from '../../world-character-entity.svelte';
import { useBehavior } from '$lib/hooks/use-behavior';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';

/**
 * 새로운 행동을 선택 (우선순위 기반)
 */
export default function selectNewBehavior(entity: WorldCharacterEntity, tick: number): void {
	const {
		needBehaviorStore,
		needBehaviorActionStore,
		conditionBehaviorActionStore,
		behaviorPriorityStore,
	} = useBehavior();

	// 1. 후보 need behaviors 찾기 (threshold 이하인 욕구)
	const candidateNeedBehaviors = Object.values(get(needBehaviorStore).data).filter((behavior) => {
		const need = entity.worldCharacterNeeds[behavior.need_id];
		if (!need) {
			return false;
		}

		// 욕구 레벨이 threshold 이하이면 발동
		const meetsThreshold = need.value <= behavior.need_threshold;
		return meetsThreshold;
	});

	// 2. 후보 condition behaviors 찾기
	// TODO: 컨디션 조건 체크 로직 (나중에 구현)
	const candidateConditionBehaviors: ConditionBehavior[] = [];

	// 3. 우선순위에 따라 정렬
	const allCandidates: Array<
		| { type: 'need'; behaviorId: NeedBehaviorId }
		| { type: 'condition'; behaviorId: ConditionBehaviorId }
	> = [
		...candidateNeedBehaviors.map((behavior) => ({
			type: 'need' as const,
			behaviorId: behavior.id,
		})),
		...candidateConditionBehaviors.map((behavior) => ({
			type: 'condition' as const,
			behaviorId: behavior.id,
		})),
	];

	if (allCandidates.length === 0) {
		// 후보가 없으면 종료
		return;
	}

	// BehaviorPriority에서 우선순위 가져오기
	const priorities = get(behaviorPriorityStore).data;
	const sortedCandidates = allCandidates.sort((a, b) => {
		const priorityA = Object.values(priorities).find((p) =>
			a.type === 'need'
				? p.need_behavior_id === a.behaviorId
				: p.condition_behavior_id === a.behaviorId
		);
		const priorityB = Object.values(priorities).find((p) =>
			b.type === 'need'
				? p.need_behavior_id === b.behaviorId
				: p.condition_behavior_id === b.behaviorId
		);

		const valA = priorityA?.priority ?? 0;
		const valB = priorityB?.priority ?? 0;

		// 높은 우선순위가 먼저 오도록 내림차순 정렬
		return valB - valA;
	});

	const selected = sortedCandidates[0];
	if (!selected) return;

	// 4. root action 찾기
	const actions =
		selected.type === 'need'
			? Object.values(get(needBehaviorActionStore).data).filter(
					(a) => a.behavior_id === selected.behaviorId && a.root
				)
			: Object.values(get(conditionBehaviorActionStore).data).filter(
					(a) => a.condition_behavior_id === selected.behaviorId && a.root
				);

	const rootAction = actions[0];
	if (!rootAction) {
		// root action이 없으면 종료
		return;
	}

	// 5. currentBehaviorId 설정 및 시작 tick 기록
	entity.currentBehaviorId = BehaviorIdUtils.create(
		selected.type,
		selected.behaviorId,
		rootAction.id
	);
	entity.actionStartTick = tick;
}
