import { useBehavior, useWorld } from '$lib/hooks';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * 아이템 사용 인터렉션 (fulfill)
 *
 * fulfill_interaction_type이 아이템 사용인 경우 아이템 사용 인터렉션을 실행합니다.
 * 사용 인터렉션 진행 중 need_fulfilments, condition_fulfillments를 실행합니다.
 *
 * @returns true: 행동 실행 중단, false: 행동 실행 계속 진행
 */
export default function tickActionFulfillItemUse(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	const { getBehaviorAction } = useBehavior();
	const { getInteraction } = useWorld();

	const behaviorAction = getBehaviorAction(this.behaviorTargetId);
	if (!behaviorAction) return false;

	// fulfill 타입이 아니면 skip
	if (behaviorAction.type !== 'fulfill') return false;

	const interaction = getInteraction(behaviorAction);
	if (!interaction) return false;

	// TODO: fulfill_interaction_type 확인 (현재는 모든 fulfill을 처리)
	// - 들고 있는 아이템 확인
	// - 타겟 엔티티가 있으면 사용 인터렉션 실행
	// - need_fulfilments, condition_fulfillments 실행

	return false;
}
