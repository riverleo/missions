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
