import { get, writable } from 'svelte/store';
import { Dice } from './dice';
import { activateLayer, deactivateLayer } from '$lib/shortcut/store';
import { next } from '$lib/components/app/narrative/store';
import type { UUID } from 'crypto';

export interface DiceRoll {
	difficultyClass: number;
	success: DiceRollAction;
	failure: DiceRollAction;
}

export type DiceRollAction =
	| {
			type: 'narrative';
			narrativeNodeId: UUID;
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

	activateLayer('dice-roll');

	// difficultyClass가 0이면 자동으로 성공 처리
	if (diceRoll.difficultyClass === 0) next(roll());
}

export function terminate() {
	current.set(undefined);
	diceRolled.set(undefined);

	deactivateLayer('dice-roll');
}
