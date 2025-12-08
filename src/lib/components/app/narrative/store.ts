import { get, writable } from 'svelte/store';
import {
	type DiceRoll,
	type DiceRolled,
	diceRolled,
	terminate as terminateDiceRoll,
} from '$lib/components/app/dice-roll/store';
import {
	activateLayer as activateLayer,
	deactivateLayer as deactivateLayer,
} from '$lib/shortcut/store';
import type { UUID } from 'crypto';

export interface NarrativeNodeChoice {
	id: UUID;
	text: string;
	diceRoll: DiceRoll;
}

export type NarrativeNode = {
	id: UUID;
	message: string;
	description?: string;
	root: boolean;
} & (
	| {
			type: 'text';
			diceRoll: DiceRoll;
	  }
	| {
			type: 'choice';
			choices: NarrativeNodeChoice[];
	  }
);

export interface Narrative {
	id: UUID;
	name: string;
	nodes: NarrativeNode[];
}

export const currentNarrative = writable<Narrative | undefined>();
export const currentNarrativeNode = writable<NarrativeNode | undefined>();

export const messageComplete = writable<boolean>(false);
export const narrativeActionHeight = writable<number>(0);
export const focusedNarrativeNodeChoice = writable<NarrativeNodeChoice | undefined>();

export function next(targetDiceRolled?: DiceRolled) {
	const $diceRolled = targetDiceRolled || get(diceRolled);

	if ($diceRolled === undefined) {
		console.warn('Dice rolled does not exist.');
	} else {
		const { action } = $diceRolled;

		switch (action.type) {
			case 'narrative':
				open(action.narrativeNodeId);
				break;
			case 'terminate':
				terminate();
				break;
		}
	}

	terminateDiceRoll();
}

export function open(narrativeNodeId: UUID) {
	const $narrative = get(currentNarrative);

	if ($narrative === undefined) {
		return console.warn('Narrative bundle not loaded.');
	}

	const node = $narrative.nodes.find((n) => n.id === narrativeNodeId);

	if (node === undefined) {
		return console.warn(`Narrative node "${narrativeNodeId}" not found.`);
	}

	currentNarrativeNode.set(node);
	messageComplete.set(false);
	focusedNarrativeNodeChoice.set(undefined);
	narrativeActionHeight.set(0);

	terminateDiceRoll();
	activateLayer('narrative');
}

export function terminate() {
	currentNarrativeNode.set(undefined);
	focusedNarrativeNodeChoice.set(undefined);

	terminateDiceRoll();
	deactivateLayer('narrative');
}
