import { get, writable } from 'svelte/store';
import type { DialogNode } from '.';
import type { DiceRolled } from '../dice-roll';

export const dialogNode = writable<DialogNode | undefined>();
export const dialogNodes = writable<Record<string, DialogNode>>({});

export function exec(diceRolled: DiceRolled) {
	const { action } = diceRolled;

	if (action.type === 'dialogNode') {
		if (action.dialogNodeId === undefined) {
			return close();
		}

		return open(action.dialogNodeId);
	}

	console.error('Dice rolled does not executed.', diceRolled);
}

export function close() {
	dialogNode.set(undefined);
}

export function open(dialogNodeId: string) {
	const $dialogNodes = get(dialogNodes);
	const $dialogNode = $dialogNodes[dialogNodeId];

	if ($dialogNode === undefined) {
		throw new Error(`Dialog node with ID "${dialogNodeId}" not found.`);
	}

	dialogNode.set($dialogNode);
}
