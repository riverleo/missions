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
 * @returns {boolean} 체인이 시작되었는지 여부
 */
export default function startInteractionChain(
	entity: WorldCharacterEntity,
	interaction: any,
	currentTick: number
): boolean {
	const { buildingInteractionActionStore } = useBuilding();
	const { itemInteractionActionStore } = useItem();
	const { characterInteractionActionStore } = useCharacter();

	// Interaction 타입별로 InteractionAction 가져오기
	let interactionActions: any[] = [];
	if (interaction.id && interaction.building_id !== undefined) {
		// BuildingInteraction: store.data[interactionId]에 actions 배열이 저장됨
		const actions = get(buildingInteractionActionStore).data[interaction.id as BuildingInteractionId];
		interactionActions = actions || [];
		console.log('[startInteractionChain] Building interaction actions:', interactionActions.length);
	} else if (interaction.id && interaction.item_id !== undefined) {
		// ItemInteraction
		const storeData = get(itemInteractionActionStore).data;
		console.log('[startInteractionChain] Item interaction ID:', interaction.id);
		console.log('[startInteractionChain] ItemInteractionActionStore keys:', Object.keys(storeData));
		const actions = storeData[interaction.id as ItemInteractionId];
		console.log('[startInteractionChain] Found actions:', actions);
		interactionActions = actions || [];
	} else if (interaction.id && interaction.target_character_id !== undefined) {
		// CharacterInteraction
		const actions =
			get(characterInteractionActionStore).data[interaction.id as CharacterInteractionId];
		interactionActions = actions || [];
		console.log('[startInteractionChain] Character interaction actions:', interactionActions.length);
	}

	// root action 찾기
	console.log('[startInteractionChain] All actions:', interactionActions.map(a => ({ id: a.id, root: a.root, order: a.order })));
	const rootAction = interactionActions.find((a) => a.root);
	if (!rootAction) {
		console.log('[startInteractionChain] No root InteractionAction found for interaction:', interaction.id);
		// root가 없으면 order가 가장 낮은 것을 사용
		if (interactionActions.length > 0) {
			const firstAction = interactionActions.sort((a, b) => a.order - b.order)[0];
			console.log('[startInteractionChain] Using first action by order:', firstAction.id);
			entity.currentInteractionActionId = firstAction.id;
			entity.interactionActionStartTick = currentTick;
			return true;
		}
		return false;
	}

	// 체인 시작
	entity.currentInteractionActionId = rootAction.id;
	entity.interactionActionStartTick = currentTick;
	console.log('[startInteractionChain] Started chain with root action:', rootAction.id);
	return true;
}
