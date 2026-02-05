import { useBehavior, useWorld } from '$lib/hooks';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * IDLE 행동 처리
 *
 * idle 행동인 경우 대기하고, idle이 아니면 다음 tick 메서드로 진행합니다.
 * idle에도 인터렉션이 있을 수 있으므로 인터렉션 체인을 시작하고 관리합니다.
 *
 * @returns true: idle 행동 (행동 실행 중단), false: idle이 아님 (다음 tick 메서드로 진행)
 */
export default function tickIdle(this: WorldCharacterEntityBehavior, tick: number): boolean {
	const { getBehaviorAction } = useBehavior();
	const { getInteraction, getInteractionActions } = useWorld();

	const behaviorAction = getBehaviorAction(this.behaviorTargetId);
	if (!behaviorAction) return false;

	// idle 행동이 아니면 다음 메서드로 진행
	if (behaviorAction.type !== 'idle') return false;

	// 1. 인터렉션 체인 시작 (아직 시작 안 했고 인터렉션이 있으면)
	if (!this.interactionTargetId) {
		const interaction = getInteraction(behaviorAction);
		if (interaction) {
			const actions = getInteractionActions(interaction);
			const rootAction = actions.find((a) => a.root);

			if (rootAction) {
				// 첫 번째 액션으로 체인 시작
				this.interactionTargetId = InteractionIdUtils.create(
					interaction.interactionType,
					interaction.id as any,
					rootAction.id
				);
				this.interactionTargetStartTick = tick;
			}
		}
	}

	// 2. idle 행동: tickCompletion에서 인터렉션 체인 진행 및 idle_duration_ticks 체크
	// 다른 메서드들(tickFindAndGo 등)은 타입 체크로 자동 skip되므로 return false
	return false;
}
