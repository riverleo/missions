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
 * InteractionAction 체인 시작 (root action 찾아서 설정)
 */
export default function startInteractionChain(
	entity: WorldCharacterEntity,
	interaction: any,
	currentTick: number
): void {
	const { buildingInteractionActionStore } = useBuilding();
	const { itemInteractionActionStore } = useItem();
	const { characterInteractionActionStore } = useCharacter();

	// Interaction 타입별로 InteractionAction 가져오기
	let interactionActions: any[] = [];
	if (interaction.id && interaction.building_id !== undefined) {
		// BuildingInteraction: store.data[interactionId]에 actions 배열이 저장됨
		const actions = get(buildingInteractionActionStore).data[interaction.id as BuildingInteractionId];
		interactionActions = actions || [];
	} else if (interaction.id && interaction.item_id !== undefined) {
		// ItemInteraction
		const actions = get(itemInteractionActionStore).data[interaction.id as ItemInteractionId];
		interactionActions = actions || [];
	} else if (interaction.id && interaction.target_character_id !== undefined) {
		// CharacterInteraction
		const actions =
			get(characterInteractionActionStore).data[interaction.id as CharacterInteractionId];
		interactionActions = actions || [];
	}

	// root action 찾기
	const rootAction = interactionActions.find((a) => a.root);
	if (!rootAction) {
		console.error('No root InteractionAction found for interaction:', interaction);
		return;
	}

	// 체인 시작
	entity.currentInteractionActionId = rootAction.id;
	entity.interactionActionStartTick = currentTick;
}
