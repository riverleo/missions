import type {
	BuildingInteractionId,
	ItemInteractionId,
	CharacterInteractionId,
	InteractionType,
} from '$lib/types';
import type { WorldCharacterEntity } from '../../world-character-entity.svelte';
import { useBuilding } from '$lib/hooks/use-building';
import { useItem } from '$lib/hooks/use-item';
import { useCharacter } from '$lib/hooks/use-character';
import { InteractionIdUtils } from '$lib/utils/interaction-id';

/**
 * InteractionAction 체인 시작 (root action 찾아서 설정)
 * @returns {boolean} 체인이 시작되었는지 여부
 */
export default function startInteractionChain(
	entity: WorldCharacterEntity,
	interaction: any,
	currentTick: number
): boolean {
	const { getBuildingInteractionActions } = useBuilding();
	const { getItemInteractionActions } = useItem();
	const { getCharacterInteractionActions } = useCharacter();

	// Interaction 타입 및 ID 결정
	let interactionType: InteractionType;
	let interactionId: string;
	let interactionActions: any[] = [];

	if (interaction.id && interaction.building_id !== undefined) {
		// BuildingInteraction: store.data[interactionId]에 actions 배열이 저장됨
		interactionType = 'building';
		interactionId = interaction.id;
		const actions = getBuildingInteractionActions(interaction.id);
		interactionActions = actions || [];
	} else if (interaction.id && interaction.item_id !== undefined) {
		// ItemInteraction
		interactionType = 'item';
		interactionId = interaction.id;
		const actions = getItemInteractionActions(interaction.id);
		interactionActions = actions || [];
	} else if (interaction.id && interaction.target_character_id !== undefined) {
		// CharacterInteraction
		interactionType = 'character';
		interactionId = interaction.id;
		const actions =
			getCharacterInteractionActions(interaction.id);
		interactionActions = actions || [];
	} else {
		return false;
	}

	// root action 찾기
	const rootAction = interactionActions.find((a) => a.root);
	if (!rootAction) {
		// root가 없으면 order가 가장 낮은 것을 사용
		if (interactionActions.length > 0) {
			const firstAction = interactionActions.sort((a, b) => a.order - b.order)[0];
			entity.currentInteractionTargetId = InteractionIdUtils.create(
				interactionType,
				interactionId as any,
				firstAction.id
			);
			entity.interactionTargetStartTick = currentTick;
			return true;
		}
		return false;
	}

	// 체인 시작
	entity.currentInteractionTargetId = InteractionIdUtils.create(
		interactionType,
		interactionId as any,
		rootAction.id
	);
	entity.interactionTargetStartTick = currentTick;
	return true;
}
