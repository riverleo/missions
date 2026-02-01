import type { BehaviorAction } from '$lib/types';
import type { WorldCharacterEntity } from '../../world-character-entity.svelte';
import { useBehavior } from '$lib/hooks/use-behavior';

/**
 * 행동 완료 조건 확인
 */
export default function checkActionCompletion(
	entity: WorldCharacterEntity,
	behaviorAction: BehaviorAction,
	tick: number
): boolean {
	// GO: path가 비면 완료
	if (behaviorAction.type === 'go') {
		return entity.path.length === 0;
	}

	// INTERACT: InteractionAction 체인이 완료되어야 함
	if (behaviorAction.type === 'interact') {
		// 타겟이 없으면: 이미 완료됨 (아이템을 주워서 타겟 클리어된 경우)
		if (!entity.currentTargetEntityId) {
			return !entity.currentInteractionTargetId;
		}

		const targetEntity = entity.worldContext.entities[entity.currentTargetEntityId];
		// 타겟 엔티티가 없으면: 이미 완료됨 (아이템을 주워서 엔티티 제거된 경우)
		if (!targetEntity) {
			return !entity.currentInteractionTargetId;
		}

		const distance = Math.hypot(targetEntity.x - entity.x, targetEntity.y - entity.y);
		if (distance >= 50) return false; // 아직 도착하지 않음

		// once_interaction_type: InteractionAction 체인이 완료되었는지 확인
		// currentInteractionTargetId가 undefined이면 체인 완료
		return !entity.currentInteractionTargetId;
	}

	// FULFILL: 욕구/컨디션 충족 여부 확인
	if (behaviorAction.type === 'fulfill') {
		const isNeedAction = behaviorAction.behaviorType === 'need';

		if (isNeedAction) {
			const { getAllNeedBehaviors } = useBehavior();
			const behavior = getAllNeedBehaviors().find((b) => b.need_id === behaviorAction.need_id);
			if (!behavior) return false;

			const need = entity.worldCharacterNeeds[behaviorAction.need_id];
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
		return tick - entity.behaviorActionStartTick >= behaviorAction.idle_duration_ticks;
	}

	return false;
}
