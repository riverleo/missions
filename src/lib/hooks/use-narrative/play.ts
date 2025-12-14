import type { NarrativeNodeChoice } from '$lib/types';
import type {
	NarrativeStore,
	NarrativeNodeStore,
	NarrativeDiceRollStore,
	NarrativeNodeChoiceStore,
	PlayStore,
} from '.';

export const open =
	(
		narrativeStore: NarrativeStore,
		narrativeNodeStore: NarrativeNodeStore,
		narrativeDiceRollStore: NarrativeDiceRollStore,
		playStore: PlayStore
	) =>
	(narrativeNodeId: string) => {
		// TODO: implement
	};

export const roll =
	(narrativeDiceRollStore: NarrativeDiceRollStore, playStore: PlayStore) => (): number | undefined => {
		// TODO: implement
		return undefined;
	};

export const next =
	(
		narrativeNodeStore: NarrativeNodeStore,
		narrativeNodeChoiceStore: NarrativeNodeChoiceStore,
		narrativeDiceRollStore: NarrativeDiceRollStore,
		playStore: PlayStore
	) =>
	() => {
		// TODO: implement
	};

export const done = (playStore: PlayStore) => () => {
	// TODO: implement
};

export const highlight =
	(playStore: PlayStore) => (narrativeNodeChoice: NarrativeNodeChoice | undefined) => {
		// TODO: implement
	};

export const select =
	(
		narrativeNodeStore: NarrativeNodeStore,
		narrativeNodeChoiceStore: NarrativeNodeChoiceStore,
		narrativeDiceRollStore: NarrativeDiceRollStore,
		playStore: PlayStore
	) =>
	(narrativeNodeChoice: NarrativeNodeChoice) => {
		// TODO: implement
	};
