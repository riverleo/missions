import { get, writable } from 'svelte/store';
import type { DialogNode } from '.';
import type { DiceRolled } from '../dice-roll';
import * as diceRoll from '../dice-roll/store';

export const source = writable<Record<string, DialogNode>>({});
export const current = writable<DialogNode | undefined>();

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

	diceRoll.clear();
}

/**
 * 대화를 종료한다.
 */
export function terminate() {
	current.set(undefined);
	diceRoll.clear();
}

export function open(dialogNodeId: string) {
	const $dialogNode = get(source)[dialogNodeId];

	if ($dialogNode === undefined) {
		return console.warn(`Dialog node "${dialogNodeId}" not found.`);
	}

	current.set($dialogNode);
}
