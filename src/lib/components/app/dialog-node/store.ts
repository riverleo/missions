import { get, writable } from 'svelte/store';
import {
	type DiceRoll,
	type DiceRolled,
	diceRolled,
	terminate as terminateDiceRoll,
} from '$lib/components/app/dice-roll/store';
import { activate as activateLayer, deactivate as deactivateLayer } from '$lib/shortcut/layers';

export interface DialogNodeChoice {
	id: string;
	text: string;
	diceRoll: DiceRoll;
}

export type DialogNode = {
	id: string;
	speaker: string;
	message: string;
	description?: string;
	root: boolean;
} & (
	| {
			type: 'narrative';
			diceRoll: DiceRoll;
	  }
	| {
			type: 'choice';
			choices: DialogNodeChoice[];
	  }
);

export const source = writable<Record<string, DialogNode>>({});
export const current = writable<DialogNode | undefined>();
export const highlightedIndex = writable<number | undefined>();

export function next(targetDiceRolled?: DiceRolled) {
	const $diceRolled = targetDiceRolled || get(diceRolled);

	if ($diceRolled === undefined) {
		console.warn('Dice rolled does not exist.');
	} else {
		const { action } = $diceRolled;

		switch (action.type) {
			case 'dialogNode':
				open(action.dialogNodeId);
				break;
			case 'terminate':
				terminate();
				break;
		}
	}

	terminateDiceRoll();
}

export function open(dialogNodeId: string) {
	const $dialogNode = get(source)[dialogNodeId];

	if ($dialogNode === undefined) {
		return console.warn(`Dialog node "${dialogNodeId}" not found.`);
	}

	current.set($dialogNode);
	highlightedIndex.set(undefined);

	terminateDiceRoll();
	activateLayer('dialog-node');
}

export function terminate() {
	current.set(undefined);
	highlightedIndex.set(undefined);

	terminateDiceRoll();
	deactivateLayer('dialog-node');
}
