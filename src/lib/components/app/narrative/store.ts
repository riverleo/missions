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

export interface NarrativeChoice {
	id: string;
	text: string;
	diceRoll: DiceRoll;
}

export type Narrative = {
	id: string;
	speaker: string;
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
			choices: NarrativeChoice[];
	  }
);

export const source = writable<Record<string, Narrative>>({});
export const current = writable<Narrative | undefined>();

export const messageComplete = writable<boolean>(false);
export const narrativeActionHeight = writable<number>(0);
export const focusedNarrativeChoice = writable<NarrativeChoice | undefined>();

export function next(targetDiceRolled?: DiceRolled) {
	const $diceRolled = targetDiceRolled || get(diceRolled);

	if ($diceRolled === undefined) {
		console.warn('Dice rolled does not exist.');
	} else {
		const { action } = $diceRolled;

		switch (action.type) {
			case 'narrative':
				open(action.narrativeId);
				break;
			case 'terminate':
				terminate();
				break;
		}
	}

	terminateDiceRoll();
}

export function open(narrativeId: string) {
	const $narrative = get(source)[narrativeId];

	if ($narrative === undefined) {
		return console.warn(`Narrative "${narrativeId}" not found.`);
	}

	current.set($narrative);
	messageComplete.set(false);
	focusedNarrativeChoice.set(undefined);
	narrativeActionHeight.set(0);

	terminateDiceRoll();
	activateLayer('narrative');
}

export function terminate() {
	current.set(undefined);
	focusedNarrativeChoice.set(undefined);

	terminateDiceRoll();
	deactivateLayer('narrative');
}
