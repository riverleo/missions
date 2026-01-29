import { get } from 'svelte/store';
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
	if (!entity.currentInteractionActionId) return false;

	const { buildingInteractionActionStore } = useBuilding();
	const { itemInteractionActionStore } = useItem();
	const { characterInteractionActionStore } = useCharacter();

	// 현재 InteractionAction 가져오기
	let currentAction: any = undefined;
	if (interaction.building_id !== undefined) {
		const actions = get(buildingInteractionActionStore).data[interaction.id as BuildingInteractionId];
		if (actions) {
			currentAction = actions.find((a) => a.id === entity.currentInteractionActionId);
		}
	} else if (interaction.item_id !== undefined) {
		const actions = get(itemInteractionActionStore).data[interaction.id as ItemInteractionId];
		if (actions) {
			currentAction = actions.find((a) => a.id === entity.currentInteractionActionId);
		}
	} else if (interaction.target_character_id !== undefined) {
		const actions =
			get(characterInteractionActionStore).data[interaction.id as CharacterInteractionId];
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
