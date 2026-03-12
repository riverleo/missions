import { writable } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScenarioId } from '$lib/types';

type SnapshotInsertPayload = {
	scenario_id: ScenarioId;
	name: string;
	description: string;
	data: Record<string, unknown>;
};

function createScenarioSnapshotSupabaseMock() {
	let snapshotInsertPayload: SnapshotInsertPayload | undefined;

	const supabase = {
		from(table: string) {
			if (table !== 'scenario_snapshots') {
				throw new Error(`Unexpected table: ${table}`);
			}

			return {
				insert(payload: SnapshotInsertPayload) {
					snapshotInsertPayload = payload;

					return {
						select() {
							return {
								async single() {
									return {
										data: {
											id: 'snapshot-1',
											...payload,
										},
										error: null,
									};
								},
							};
						},
					};
				},
			};
		},
	};

	return {
		supabase,
		getSnapshotInsertPayload: () => snapshotInsertPayload,
	};
}

function createEmptyRecordStore() {
	return writable({ status: 'success' as const, data: {} });
}

describe('createScenarioSnapshot(scenarioId: ScenarioId, name: string, description?: string)', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('스냅샷 데이터에 terrainTiles 필드를 포함하지 않는다.', async () => {
		const { supabase, getSnapshotInsertPayload } = createScenarioSnapshotSupabaseMock();

		vi.doMock('./use-app.svelte', () => ({
			useApp: () => ({ supabase }),
		}));

		vi.doMock('./use-terrain', () => ({
			useTerrain: () => ({
				terrainStore: writable({
					status: 'success' as const,
					data: {
						terrain1: {
							id: 'terrain-1',
							scenario_id: 'scenario-1',
							title: 'Terrain',
						},
					},
				}),
				tileStore: writable({
					status: 'success' as const,
					data: {
						tile1: {
							id: 'tile-1',
							scenario_id: 'scenario-1',
							title: 'Tile',
						},
					},
				}),
				tileStateStore: writable({
					status: 'success' as const,
					data: {
						tile1: [
							{
								id: 'tile-state-1',
								scenario_id: 'scenario-1',
								tile_id: 'tile-1',
							},
						],
					},
				}),
			}),
		}));

		vi.doMock('./use-character', () => ({
			useCharacter: () => ({
				getAllCharacterBodies: () => [],
				getAllCharacterNeeds: () => [],
				getAllCharacters: () => [],
				getAllNeeds: () => [],
				getOrUndefinedCharacterBodyStates: () => undefined,
				getOrUndefinedCharacterFaceStates: () => undefined,
			}),
		}));

		vi.doMock('./use-building', () => ({
			useBuilding: () => ({
				getAllBuildingConditions: () => [],
				getAllBuildings: () => [],
				getAllConditionEffects: () => [],
				getAllConditions: () => [],
				getOrUndefinedBuildingStates: () => undefined,
			}),
		}));

		vi.doMock('./use-behavior/index', () => ({
			useBehavior: () => ({
				conditionBehaviorActionStore: createEmptyRecordStore(),
				getAllBehaviorPriorities: () => [],
				getAllConditionBehaviors: () => [],
				getAllNeedBehaviorActions: () => [],
				getAllNeedBehaviors: () => [],
			}),
		}));

		vi.doMock('./use-fulfillment', () => ({
			useFulfillment: () => ({
				getAllNeedFulfillments: () => [],
				getAllConditionFulfillments: () => [],
			}),
		}));

		vi.doMock('./use-item', () => ({
			useItem: () => ({
				getAllItems: () => [],
				getOrUndefinedItemStates: () => undefined,
			}),
		}));

		vi.doMock('./use-interaction', () => ({
			useInteraction: () => ({
				getAllCharacterInteractions: () => [],
				getAllCharacterInteractionActions: () => [],
				getAllBuildingInteractions: () => [],
				getAllBuildingInteractionActions: () => [],
				getAllItemInteractions: () => [],
				getAllItemInteractionActions: () => [],
			}),
		}));

		vi.doMock('./use-quest', () => ({
			useQuest: () => ({
				questStore: createEmptyRecordStore(),
				questBranchStore: createEmptyRecordStore(),
			}),
		}));

		vi.doMock('./use-chapter', () => ({
			useChapter: () => ({
				chapterStore: createEmptyRecordStore(),
			}),
		}));

		vi.doMock('./use-narrative', () => ({
			useNarrative: () => ({
				narrativeStore: createEmptyRecordStore(),
				narrativeNodeStore: createEmptyRecordStore(),
				narrativeNodeChoiceStore: createEmptyRecordStore(),
				narrativeDiceRollStore: createEmptyRecordStore(),
			}),
		}));

		const { useScenario } = await import('./use-scenario');
		const scenarioStore = useScenario();

		await scenarioStore.admin.createScenarioSnapshot(
			'scenario-1' as ScenarioId,
			'Snapshot',
			'Description'
		);

		expect(getSnapshotInsertPayload()).toBeDefined();
		expect(getSnapshotInsertPayload()?.data).not.toHaveProperty('terrainTiles');
		expect(getSnapshotInsertPayload()?.data).toHaveProperty('terrains');
		expect(getSnapshotInsertPayload()?.data).toHaveProperty('tiles');
		expect(getSnapshotInsertPayload()?.data).toHaveProperty('tileStates');
	});
});
