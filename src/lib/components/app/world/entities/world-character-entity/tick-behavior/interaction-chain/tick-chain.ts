import type {
	BuildingInteractionId,
	ItemInteractionId,
	CharacterInteractionId,
} from '$lib/types';
import type { WorldCharacterEntity } from '../../world-character-entity.svelte';
import { useBuilding } from '$lib/hooks/use-building';
import { useItem } from '$lib/hooks/use-item';
import { useCharacter } from '$lib/hooks/use-character';

/**
 * InteractionAction 체인 실행 및 다음 액션으로 전환
 * @returns 체인이 완료되었으면 true, 아직 실행 중이면 false
 */
export default function tickInteractionAction(
	entity: WorldCharacterEntity,
	interaction: any,
	currentTick: number
): boolean {
	const { getBuildingInteractionActions } = useBuilding();
	const { getItemInteractionActions } = useItem();
	const { getCharacterInteractionActions } = useCharacter();

	if (!entity.currentInteractionActionId) return false;
	// 현재 InteractionAction 가져오기
	let currentAction: any = undefined;
	if (interaction.building_id !== undefined) {
		const actions = getBuildingInteractionActions(interaction.id);
		if (actions) {
			currentAction = actions.find((a) => a.id === entity.currentInteractionActionId);
		}
	} else if (interaction.item_id !== undefined) {
		const actions = getItemInteractionActions(interaction.id);
		if (actions) {
			currentAction = actions.find((a) => a.id === entity.currentInteractionActionId);
		}
	} else if (interaction.target_character_id !== undefined) {
		const actions =
			getCharacterInteractionActions(interaction.id);
		if (actions) {
			currentAction = actions.find((a) => a.id === entity.currentInteractionActionId);
		}
	}

	if (!currentAction) {
		console.error('CurrentInteractionAction not found:', entity.currentInteractionActionId);
		entity.currentInteractionActionId = undefined;
		return true;
	}

	// duration_ticks 경과 확인
	const elapsed = currentTick - entity.interactionActionStartTick;
	if (elapsed < currentAction.duration_ticks) {
		return false; // 아직 실행 중
	}

	// 다음 액션이 있으면 전환
	const nextActionId =
		currentAction.next_building_interaction_action_id ||
		currentAction.next_item_interaction_action_id ||
		currentAction.next_character_interaction_action_id;

	if (nextActionId) {
		entity.currentInteractionActionId = nextActionId;
		entity.interactionActionStartTick = currentTick;
		return false; // 체인 계속 진행
	}

	// 다음 액션이 없으면 체인 완료
	return true;
}
