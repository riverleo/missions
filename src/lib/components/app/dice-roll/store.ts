import { get, writable } from 'svelte/store';
import { Dice } from './dice';
import { activate, deactivate } from '$lib/shortcut/layers';

export interface DiceRoll {
	difficultyClass: number;
	silent: boolean;
	success: DiceRollAction;
	failure: DiceRollAction;
}

export type DiceRollAction =
	| {
			type: 'dialogNode';
			dialogNodeId: string;
	  }
	| { type: 'terminate' };

export interface DiceRolled {
	value: number;
	action: DiceRollAction;
	diceRoll: DiceRoll;
}

export const current = writable<DiceRoll | undefined>();
export const diceRolled = writable<DiceRolled | undefined>();

export function roll(): DiceRolled | undefined {
	const $diceRoll = get(current);
	const $diceRolled = get(diceRolled);

	if ($diceRoll === undefined) return console.warn('There is no dice roll.') ?? undefined;
	if ($diceRolled !== undefined) return console.warn('Dice already rolled.') ?? undefined;

	const value = Dice.D20.roll();
	const success = value >= $diceRoll.difficultyClass;

	const newDiceRolled = {
		value,
		success,
		action: success ? $diceRoll.success : $diceRoll.failure,
		diceRoll: $diceRoll,
	};

	diceRolled.set(newDiceRolled);

	return newDiceRolled;
}

export function open(diceRoll: DiceRoll) {
	current.set(diceRoll);

	activate('dice-roll');
}

export function terminate() {
	current.set(undefined);
	diceRolled.set(undefined);

	deactivate('dice-roll');
}
