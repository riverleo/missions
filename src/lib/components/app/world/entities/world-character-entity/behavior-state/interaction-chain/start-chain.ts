import { useInteraction } from '$lib/hooks';
import type {
	Interaction,
	BuildingInteractionAction,
	ItemInteractionAction,
	CharacterInteractionAction,
} from '$lib/types';
import type { WorldCharacterEntity } from '../../world-character-entity.svelte';
import { InteractionIdUtils } from '$lib/utils/interaction-id';

/**
 * InteractionAction 체인 시작 (root action 찾아서 설정)
 * @returns {boolean} 체인이 시작되었는지 여부
 */
export default function startInteractionChain(
	this: WorldCharacterEntity,
	interaction: Interaction,
	tick: number
): boolean {
	const { getBuildingInteractionActions, getItemInteractionActions, getCharacterInteractionActions } = useInteraction();

	// InteractionAction 가져오기
	let interactionActions:
		| BuildingInteractionAction[]
		| ItemInteractionAction[]
		| CharacterInteractionAction[] = [];

	if (interaction.interactionType === 'building') {
		const actions = getBuildingInteractionActions(interaction.id);
		interactionActions = actions || [];
	} else if (interaction.interactionType === 'item') {
		const actions = getItemInteractionActions(interaction.id);
		interactionActions = actions || [];
	} else if (interaction.interactionType === 'character') {
		const actions = getCharacterInteractionActions(interaction.id);
		interactionActions = actions || [];
	} else {
		return false;
	}

	// root action 찾기
	const rootAction = interactionActions.find((a) => a.root);
	if (!rootAction) {
		// root가 없으면 첫 번째 액션 사용
		if (interactionActions.length > 0) {
			const firstAction = interactionActions[0];
			if (!firstAction) return false;
			this.behavior.interactionTargetId = InteractionIdUtils.create(
				interaction.interactionType,
				interaction.id as any,
				firstAction.id
			);
			this.behavior.interactionStartTick = tick;
			return true;
		}
		return false;
	}

	// 체인 시작
	this.behavior.interactionTargetId = InteractionIdUtils.create(
		interaction.interactionType,
		interaction.id as any,
		rootAction.id
	);
	this.behavior.interactionStartTick = tick;
	return true;
}
