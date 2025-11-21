import { get, writable } from 'svelte/store';
import type { DiceRoll, DiceRolled } from '.';
import { Dice } from './dice';

export const current = writable<DiceRoll | undefined>();
export const diceRolled = writable<DiceRolled | undefined>();

export function roll(targetDiceRoll?: DiceRoll): DiceRolled | undefined {
	const $diceRoll = targetDiceRoll || get(current);

	if (targetDiceRoll) {
		current.set(targetDiceRoll);
		diceRolled.set(undefined);

		if (!targetDiceRoll.silent) return;
	}

	if (!$diceRoll) throw new Error('Dice roll is not ready.');

	const value = Dice.D20.roll();
	const success = value >= $diceRoll.difficultyClass;

	const $diceRolled = {
		value,
		success,
		action: success ? $diceRoll.success : $diceRoll.failure,
		diceRoll: $diceRoll,
	};

	diceRolled.set($diceRolled);

	return $diceRolled;
}

export function clear() {
	current.set(undefined);
	diceRolled.set(undefined);
}
