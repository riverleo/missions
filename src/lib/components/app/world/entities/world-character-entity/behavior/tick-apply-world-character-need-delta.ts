import { useBehavior, useCharacter } from '$lib/hooks';
import type { NeedId } from '$lib/types';
import type { WorldCharacterNeedDelta } from '../world-character-need-delta';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * WorldCharacterNeedDelta를 캐릭터 needs에 최종 반영합니다.
 *
 * 조건부 입력 무시(예: item_use 실행 중 tick-decrease-needs 무시)와
 * min/max 경계 보정을 이 함수에서 일괄 처리합니다.
 */
export default function tickApplyWorldCharacterNeedDelta(
	this: WorldCharacterEntityBehavior,
	worldCharacterNeedDelta: WorldCharacterNeedDelta
): void {
	const { getNeed } = useCharacter();
	const ignoreTickDecreaseNeedsInputByActionState =
		shouldIgnoreTickDecreaseNeedsInputByActionState(this);

	for (const [needId, deltaValue] of Object.entries(worldCharacterNeedDelta) as [
		NeedId,
		WorldCharacterNeedDelta[NeedId],
	][]) {
		if (!deltaValue) {
			continue;
		}

		const currentNeed = this.worldCharacterEntity.needs[needId];
		if (!currentNeed) {
			continue;
		}

		const appliedDelta = getAppliedDelta(
			deltaValue.total,
			deltaValue.tickDecreaseNeeds,
			ignoreTickDecreaseNeedsInputByActionState
		);

		if (appliedDelta === 0) {
			continue;
		}

		const need = getNeed(currentNeed.need_id);
		const nextValue = currentNeed.value + appliedDelta;
		currentNeed.value = Math.min(need.max_value, Math.max(0, nextValue));
	}
}

function getAppliedDelta(
	total: number,
	tickDecreaseNeeds: number,
	ignoreTickDecreaseNeedsInputByActionState: boolean
): number {
	if (ignoreTickDecreaseNeedsInputByActionState) {
		return total - tickDecreaseNeeds;
	}

	const increaseDelta = total - tickDecreaseNeeds;
	if (increaseDelta > 0) {
		return increaseDelta;
	}

	return total;
}

function shouldIgnoreTickDecreaseNeedsInputByActionState(
	behavior: WorldCharacterEntityBehavior
): boolean {
	if (behavior.interactionQueue.status !== 'action-running') {
		return false;
	}

	const currentInteractionTargetId = behavior.interactionQueue.currentInteractionTargetId;
	if (!currentInteractionTargetId) {
		return false;
	}

	const { isInteractionTargetType } = useBehavior();
	return isInteractionTargetType(currentInteractionTargetId, 'item_use');
}
