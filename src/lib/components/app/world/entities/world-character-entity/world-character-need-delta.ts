import type { NeedId } from '$lib/types';

export type WorldCharacterNeedDeltaValue = {
	total: number;
	tickDecreaseNeeds: number;
};

export type WorldCharacterNeedDelta = Partial<Record<NeedId, WorldCharacterNeedDeltaValue>>;

export function createWorldCharacterNeedDelta(): WorldCharacterNeedDelta {
	return {};
}

export function addWorldCharacterNeedDelta(
	worldCharacterNeedDelta: WorldCharacterNeedDelta,
	needId: NeedId,
	delta: number
): void {
	const current = worldCharacterNeedDelta[needId];
	if (!current) {
		worldCharacterNeedDelta[needId] = {
			total: delta,
			tickDecreaseNeeds: 0,
		};
		return;
	}

	current.total += delta;
}

export function addTickDecreaseNeedsWorldCharacterNeedDelta(
	worldCharacterNeedDelta: WorldCharacterNeedDelta,
	needId: NeedId,
	decreaseAmount: number
): void {
	const delta = -decreaseAmount;
	const current = worldCharacterNeedDelta[needId];
	if (!current) {
		worldCharacterNeedDelta[needId] = {
			total: delta,
			tickDecreaseNeeds: delta,
		};
		return;
	}

	current.total += delta;
	current.tickDecreaseNeeds += delta;
}
