import { get, writable } from 'svelte/store';
import type { DialogNode } from '.';
import type { DiceRolled } from '../dice-roll';
import * as diceRoll from '../dice-roll/store';
import { activate, deactivate } from '$lib/shortcut/layers';

export const source = writable<Record<string, DialogNode>>({});
export const current = writable<DialogNode | undefined>();
export const highlightedIndex = writable<number | undefined>();

export function next(targetDiceRolled?: DiceRolled) {
	const $diceRolled = targetDiceRolled || get(diceRoll.diceRolled);

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

	diceRoll.terminate();
}

export function open(dialogNodeId: string) {
	const $dialogNode = get(source)[dialogNodeId];

	if ($dialogNode === undefined) {
		return console.warn(`Dialog node "${dialogNodeId}" not found.`);
	}

	current.set($dialogNode);
	highlightedIndex.set(undefined);

	diceRoll.terminate();
	activate('dialog-node');
}

export function terminate() {
	current.set(undefined);
	highlightedIndex.set(undefined);

	diceRoll.terminate();
	deactivate('dialog-node');
}
