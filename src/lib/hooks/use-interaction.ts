import { derived, get } from 'svelte/store';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import type {
	Interaction,
	InteractionId,
	BuildingInteraction,
	ItemInteraction,
	CharacterInteraction,
} from '$lib/types';
import { useBuilding } from './use-building';
import { useItem } from './use-item';
import { useCharacter } from './use-character';

let instance: ReturnType<typeof createInteractionStore> | null = null;

function createInteractionStore() {
	const { buildingInteractionStore } = useBuilding();
	const { itemInteractionStore } = useItem();
	const { characterInteractionStore } = useCharacter();

	// Store derived를 사용한 computed values
	const allInteractionsStore = derived(
		[buildingInteractionStore, itemInteractionStore, characterInteractionStore],
		([$building, $item, $character]) => [
			...(Object.values($building.data) as BuildingInteraction[]).map(
				InteractionIdUtils.interaction.to
			),
			...(Object.values($item.data) as ItemInteraction[]).map(InteractionIdUtils.interaction.to),
			...(Object.values($character.data) as CharacterInteraction[]).map(
				InteractionIdUtils.interaction.to
			),
		]
	);

	const onceInteractionsStore = derived(allInteractionsStore, ($all) =>
		$all.filter((i) => i.once_interaction_type !== null)
	);

	const fulfillInteractionsStore = derived(allInteractionsStore, ($all) =>
		$all.filter((i) => i.repeat_interaction_type !== null)
	);

	// Getter functions
	function getAllInteractions(): Interaction[] {
		return get(allInteractionsStore);
	}

	function getOnceInteractions(): Interaction[] {
		return get(onceInteractionsStore);
	}

	function getFulfillInteractions(): Interaction[] {
		return get(fulfillInteractionsStore);
	}

	function getInteraction(id: InteractionId): Interaction | undefined {
		return getAllInteractions().find((i) => i.id === id);
	}

	return {
		allInteractionsStore,
		onceInteractionsStore,
		fulfillInteractionsStore,
		getAllInteractions,
		getOnceInteractions,
		getFulfillInteractions,
		getInteraction,
	};
}

export function useInteraction() {
	if (!instance) {
		instance = createInteractionStore();
	}
	return instance;
}
