export interface DiceRoll {
	difficultyClass: number;
	silent: boolean;
	success: DiceRollAction;
	failure: DiceRollAction;
}

export type DiceRollAction = {
	type: 'dialogNode';
	dialogNodeId?: string;
};

export interface DiceRolled {
	rolled: number;
	success: boolean;
	action: DiceRollAction;
	diceRoll: DiceRoll;
}
