import type { NarrativeNodeChoice, NarrativeDiceRoll, NarrativeNode } from '$lib/types';
import type { NarrativeStore, PlayStore } from '.';

const getDiceRoll = (diceRollId: string): NarrativeDiceRoll | undefined => {
	return;
};

const getNarrativeNode = (narrativeNodeId: string): NarrativeNode | undefined => {
	return;
};

export const open =
	(narrativeStore: NarrativeStore, playStore: PlayStore) => (narrativeNodeId: string) => {};

export const roll =
	(narrativeStore: NarrativeStore, playStore: PlayStore) => (): number | void => {};

export const next = (narrativeStore: NarrativeStore, playStore: PlayStore) => () => {};

export const done = (playStore: PlayStore) => () => {};

export const highlight =
	(playStore: PlayStore) => (narrativeNodeChoice: NarrativeNodeChoice | undefined) => {};

export const select =
	(narrativeStore: NarrativeStore, playStore: PlayStore) =>
	(narrativeNodeChoice: NarrativeNodeChoice) => {};
