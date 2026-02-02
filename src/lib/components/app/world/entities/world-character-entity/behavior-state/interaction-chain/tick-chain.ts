import type {
	Interaction,
	BuildingInteractionAction,
	ItemInteractionAction,
	CharacterInteractionAction,
} from '$lib/types';
import type { WorldCharacterEntity } from '../../world-character-entity.svelte';
import { useBuilding } from '$lib/hooks/use-building';
import { useItem } from '$lib/hooks/use-item';
import { useCharacter } from '$lib/hooks/use-character';
import { InteractionIdUtils } from '$lib/utils/interaction-id';

/**
 * InteractionAction 체인 실행 및 다음 액션으로 전환
 * @returns 체인이 완료되었으면 true, 아직 실행 중이면 false
 */
export default function tickInteractionAction(
	this: WorldCharacterEntity,
	interaction: Interaction,
	tick: number
): boolean {
	const { getBuildingInteractionActions } = useBuilding();
	const { getItemInteractionActions } = useItem();
	const { getCharacterInteractionActions } = useCharacter();

	if (!this.behaviorState.interactionTargetId) return false;

	// InteractionTargetId 파싱
	const { type, interactionId, interactionActionId } = InteractionIdUtils.parse(
		this.behaviorState.interactionTargetId
	);

	// 현재 InteractionAction 가져오기
	let currentAction:
		| BuildingInteractionAction
		| ItemInteractionAction
		| CharacterInteractionAction
		| undefined = undefined;
	if (interaction.interactionType === 'building') {
		const actions = getBuildingInteractionActions(interaction.id);
		if (actions) {
			currentAction = actions.find((a) => a.id === interactionActionId);
		}
	} else if (interaction.interactionType === 'item') {
		const actions = getItemInteractionActions(interaction.id);
		if (actions) {
			currentAction = actions.find((a) => a.id === interactionActionId);
		}
	} else if (interaction.interactionType === 'character') {
		const actions = getCharacterInteractionActions(interaction.id);
		if (actions) {
			currentAction = actions.find((a) => a.id === interactionActionId);
		}
	}

	if (!currentAction) {
		this.behaviorState.interactionTargetId = undefined;
		return true;
	}

	// duration_ticks 경과 확인
	const elapsed = tick - (this.behaviorState.interactionStartTick ?? 0);
	if (elapsed < currentAction.duration_ticks) {
		return false; // 아직 실행 중
	}

	// 다음 액션이 있으면 전환
	const nextActionId =
		'next_building_interaction_action_id' in currentAction
			? currentAction.next_building_interaction_action_id
			: 'next_item_interaction_action_id' in currentAction
				? currentAction.next_item_interaction_action_id
				: currentAction.next_character_interaction_action_id;

	if (nextActionId) {
		this.behaviorState.interactionTargetId = InteractionIdUtils.create(
			type,
			interactionId as any,
			nextActionId
		);
		this.behaviorState.interactionStartTick = tick;
		return false; // 체인 계속 진행
	}

	// 다음 액션이 없으면 체인 완료
	return true;
}
