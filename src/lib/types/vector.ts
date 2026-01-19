import type { Brand } from './core';

// World Pixel Coordinates
export type Vector = Brand<{ x: number; y: number }, 'Vector'>;
export type VectorKey = Brand<`${number},${number}`, 'VectorKey'>;

export type ScreenVector = Brand<{ x: number; y: number }, 'ScreenVector'>;
export type ScreenVectorKey = Brand<`${number},${number}`, 'ScreenVectorKey'>;

export type Cell = Brand<{ col: number; row: number }, 'Cell'>;
export type CellKey = Brand<`${number},${number}`, 'CellKey'>;

export type TileCell = Brand<{ col: number; row: number }, 'TileCell'>;
export type TileCellKey = Brand<`${number},${number}`, 'TileCellKey'>;

export interface PathfinderCell extends Cell {
	walkable: boolean;
}
