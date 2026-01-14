import type { Brand } from './core';
import { CELL_SIZE } from '../constants';

// ============================================================
// Vector Types (World Pixel Coordinates)
// ============================================================
export interface Vector {
	x: number;
	y: number;
}

export type VectorKey = `${number},${number}`;

// ============================================================
// Cell Types (Grid Coordinates) - Renamed from Matrix
// ============================================================
export interface Cell {
	col: number;
	row: number;
}

export type CellKey = Brand<`${number},${number}`, 'CellKey'>;

// ============================================================
// Pathfinder Cell (extends Cell with walkable/jumpable)
// ============================================================
export interface PathfinderCell extends Cell {
	walkable: boolean;
	jumpable: boolean;
}
