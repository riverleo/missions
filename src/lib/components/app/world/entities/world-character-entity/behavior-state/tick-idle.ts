import { useBehavior, useWorld, useInteraction } from '$lib/hooks';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * IDLE 행동 처리
 *
 * idle 행동인 경우 대기하고, idle이 아니면 다음 tick 메서드로 진행합니다.
 * idle의 인터렉션 체인을 시작하고 진행합니다.
 *
 * @returns true: idle 행동 진행 중 (행동 실행 중단), false: idle이 아님 (다음 tick 메서드로 진행)
 */
export default function tickIdle(this: WorldCharacterEntityBehavior, tick: number): boolean {
	const { getBehaviorAction } = useBehavior();
	const { getInteraction, getInteractionActions } = useWorld();
	const { getNextInteractionActionId } = useInteraction();

	const behaviorAction = getBehaviorAction(this.behaviorTargetId);
	if (!behaviorAction) return false;

	// idle 행동이 아니면 다음 메서드로 진행
	if (behaviorAction.type !== 'idle') return false;

	const interaction = getInteraction(behaviorAction);

	// 1. 인터렉션 체인 시작 (아직 시작 안 했고 인터렉션이 있으면)
	if (!this.interactionTargetId && interaction) {
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

	// 2. 인터렉션 체인 진행 (진행 중이면)
	if (this.interactionTargetId && interaction) {
		const { interactionActionId } = InteractionIdUtils.parse(this.interactionTargetId);
		const actions = getInteractionActions(interaction);
		const currentAction = actions.find((a) => a.id === interactionActionId);

		if (!currentAction) return true; // 액션 못 찾으면 대기

		// duration_ticks 경과 확인
		const elapsed = tick - (this.interactionTargetStartTick ?? 0);
		if (elapsed < currentAction.duration_ticks) {
			return true; // 아직 실행 중
		}

		// 다음 인터렉션 액션으로 전환 또는 체인 종료
		const nextActionId = getNextInteractionActionId(currentAction);

		if (nextActionId) {
			// 다음 인터렉션으로 전환
			this.interactionTargetId = InteractionIdUtils.create(
				interaction.interactionType,
				interaction.id as any,
				nextActionId as any
			);
			this.interactionTargetStartTick = tick;
			return true; // 계속 진행
		} else {
			// 인터렉션 체인 종료
			this.interactionTargetId = undefined;
			this.interactionTargetStartTick = undefined;
			// return false로 tickCompletion에서 idle_duration_ticks 체크
		}
	}

	// 3. 인터렉션 없거나 끝났으면 tickCompletion으로 (idle_duration_ticks 체크)
	return false;
}
