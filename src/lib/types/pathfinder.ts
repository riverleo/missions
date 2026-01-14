export interface Matrix {
	col: number;
	row: number;
}

export type MatrixKey = `${number},${number}`;

export interface PathfinderCell {
	col: number;
	row: number;
	walkable: boolean;
	jumpable: boolean;
}
