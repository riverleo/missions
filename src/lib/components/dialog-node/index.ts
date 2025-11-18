export { default as AppDialog } from './dialog-node.svelte';
export * from './store';

import { type DiceRoll } from '$lib/components/dice-roll';

export interface DialogNodeChoice {
	id: string;
	text: string;
	diceRoll: DiceRoll;
}

export type DialogNode = {
	id: string;
	speaker: string;
	text: string;
} & (
	| {
			type: 'narrative';
			diceRoll: DiceRoll;
	  }
	| {
			type: 'choices';
			choices: DialogNodeChoice[];
	  }
);
