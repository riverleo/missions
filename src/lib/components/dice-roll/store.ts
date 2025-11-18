import { get, writable } from 'svelte/store';
import type { DiceRoll, DiceRolled } from '.';
import { Dice } from './dice';

export const diceRoll = writable<DiceRoll | undefined>();
export const diceRolled = writable<DiceRolled | undefined>();

export function setDiceRoll(targetDiceRoll: DiceRoll) {
	diceRoll.set(targetDiceRoll);
	diceRolled.set(undefined);
}

export function roll(targetDiceRoll?: DiceRoll): DiceRolled {
	const $diceRoll = targetDiceRoll || get(diceRoll);

	if (targetDiceRoll) {
		setDiceRoll(targetDiceRoll);
	}

	if (!$diceRoll) throw new Error('Dice roll is not ready.');

	const rolled = Dice.D20.roll();
	const success = rolled >= $diceRoll.difficultyClass;

	const $diceRolled = {
		rolled,
		success,
		action: success ? $diceRoll.success : $diceRoll.failure,
		diceRoll: $diceRoll,
	};

	diceRolled.set($diceRolled);

	return $diceRolled;
}

export function clear() {
	diceRoll.set(undefined);
	diceRolled.set(undefined);
}
