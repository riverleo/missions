import type { BehaviorAction } from '$lib/types';
import type { WorldCharacterEntity } from '../../world-character-entity.svelte';
import { useBehavior } from '$lib/hooks/use-behavior';

/**
 * 행동 완료 조건 확인
 */
export default function checkActionCompletion(
	worldCharacterEntity: WorldCharacterEntity,
	behaviorAction: BehaviorAction,
	tick: number
): boolean {
	// ONCE: InteractionAction 체인이 완료되어야 함
	if (behaviorAction.type === 'once') {
		// 타겟이 없으면: 이미 완료됨 (아이템을 주워서 타겟 클리어된 경우)
		if (!worldCharacterEntity.behaviorState.targetEntityId) {
			return !worldCharacterEntity.behaviorState.interactionTargetId;
		}

		const targetEntity =
			worldCharacterEntity.worldContext.entities[worldCharacterEntity.behaviorState.targetEntityId];
		// 타겟 엔티티가 없으면: 이미 완료됨 (아이템을 주워서 엔티티 제거된 경우)
		if (!targetEntity) {
			return !worldCharacterEntity.behaviorState.interactionTargetId;
		}

		const distance = Math.hypot(
			targetEntity.x - worldCharacterEntity.x,
			targetEntity.y - worldCharacterEntity.y
		);
		if (distance >= 50) return false; // 아직 도착하지 않음

		// once_interaction_type: InteractionAction 체인이 완료되었는지 확인
		// currentInteractionTargetId가 undefined이면 체인 완료
		return !worldCharacterEntity.behaviorState.interactionTargetId;
	}

	// FULFILL: 욕구/컨디션 충족 여부 확인
	if (behaviorAction.type === 'fulfill') {
		const isNeedAction = behaviorAction.behaviorType === 'need';

		if (isNeedAction) {
			const { getAllNeedBehaviors } = useBehavior();
			const behavior = getAllNeedBehaviors().find((b) => b.need_id === behaviorAction.need_id);
			if (!behavior) return false;

			const need = worldCharacterEntity.needs[behaviorAction.need_id];
			if (!need) return false;

			// 욕구가 threshold를 넘으면 완료
			return need.value > behavior.need_threshold;
		} else {
			// TODO: Condition 충족 확인 (건물 수리/청소 완료 등)
			return false;
		}
	}

	// IDLE: idle_duration_ticks 경과 확인
	if (behaviorAction.type === 'idle') {
		return (
			tick - (worldCharacterEntity.behaviorState.behaviorTargetStartTick ?? 0) >=
			behaviorAction.idle_duration_ticks
		);
	}

	return false;
}
