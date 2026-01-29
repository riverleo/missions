import { get } from 'svelte/store';
import type { WorldCharacterEntity } from '../../world-character-entity.svelte';
import { useBehavior } from '$lib/hooks/use-behavior';

/**
 * 행동 완료 조건 확인
 */
export default function checkActionCompletion(
	entity: WorldCharacterEntity,
	action: any,
	currentTick: number
): boolean {
	// GO: path가 비면 완료
	if (action.type === 'go') {
		return entity.path.length === 0;
	}

	// INTERACT: InteractionAction 체인이 완료되어야 함
	if (action.type === 'interact') {
		if (!entity.currentTargetEntityId) return false;
		const targetEntity = entity.worldContext.entities[entity.currentTargetEntityId];
		if (!targetEntity) return false;

		const distance = Math.hypot(targetEntity.x - entity.x, targetEntity.y - entity.y);
		if (distance >= 50) return false; // 아직 도착하지 않음

		// once_interaction_type: InteractionAction 체인이 완료되었는지 확인
		// currentInteractionActionId가 undefined이면 체인 완료
		return !entity.currentInteractionActionId;
	}

	// FULFILL: 욕구/컨디션 충족 여부 확인
	if (action.type === 'fulfill') {
		const isNeedAction = 'need_id' in action;

		if (isNeedAction) {
			const { needBehaviorStore } = useBehavior();
			const behavior = Object.values(get(needBehaviorStore).data).find(
				(b) => b.need_id === action.need_id
			);
			if (!behavior) return false;

			const need = entity.worldCharacterNeeds[action.need_id];
			if (!need) return false;

			// 욕구가 threshold를 넘으면 완료
			return need.value > behavior.need_threshold;
		} else {
			// TODO: Condition 충족 확인 (건물 수리/청소 완료 등)
			return false;
		}
	}

	// IDLE: idle_duration_ticks 경과 확인
	if (action.type === 'idle') {
		return currentTick - entity.actionStartTick >= action.idle_duration_ticks;
	}

	return false;
}
