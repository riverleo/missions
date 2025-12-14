import { get } from 'svelte/store';
import type { PlayerRolledDice } from '$lib/types';
import type {
	NarrativeStore,
	NarrativeNodeStore,
	NarrativeDiceRollStore,
	NarrativeNodeChoiceStore,
	PlayStore,
} from '.';

interface Params {
	narrativeStore: NarrativeStore;
	narrativeNodeStore: NarrativeNodeStore;
	narrativeNodeChoiceStore: NarrativeNodeChoiceStore;
	narrativeDiceRollStore: NarrativeDiceRollStore;
	playStore: PlayStore;
}

export const run =
	({ narrativeNodeStore, playStore }: Params) =>
	(narrativeNodeId: string) => {
		const narrativeNode = get(narrativeNodeStore).data?.[narrativeNodeId];
		if (!narrativeNode) return;

		playStore.set({
			narrativeNode,
			narrativeDiceRoll: undefined,
			selectedNarrativeNodeChoice: undefined,
			playerRolledDice: undefined,
		});
	};

export const roll =
	({ narrativeDiceRollStore, playStore }: Params) =>
	(): PlayerRolledDice | undefined => {
		// TODO: implement
		return undefined;
	};

export const next =
	({ narrativeNodeStore, narrativeNodeChoiceStore, narrativeDiceRollStore, playStore }: Params) =>
	() => {
		// TODO: implement
	};

export const done =
	({ playStore }: Params) =>
	() => {
		// TODO: implement
	};

export const select =
	({ narrativeNodeStore, narrativeNodeChoiceStore, narrativeDiceRollStore, playStore }: Params) =>
	(narrativeNodeChoiceId: string) => {
		// TODO: implement
	};
