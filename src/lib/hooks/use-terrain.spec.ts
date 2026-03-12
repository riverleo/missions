import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ScenarioId } from '$lib/types';

type SelectResponse = {
	data: Record<string, unknown>[] | null;
	error: Error | null;
};

function createSupabaseMock() {
	const selectTables: string[] = [];

	const responses = new Map<string, SelectResponse>([
		[
			'terrains',
			{
				data: [
					{
						id: 'terrain-1',
						scenario_id: 'scenario-1',
						display_order: 1,
						title: 'Terrain',
					},
				],
				error: null,
			},
		],
		[
			'tiles',
			{
				data: [
					{
						id: 'tile-1',
						scenario_id: 'scenario-1',
						title: 'Tile',
					},
				],
				error: null,
			},
		],
		[
			'tile_states',
			{
				data: [
					{
						id: 'tile-state-1',
						scenario_id: 'scenario-1',
						tile_id: 'tile-1',
						title: 'Idle',
					},
				],
				error: null,
			},
		],
	]);

	const supabase = {
		from(table: string) {
			return {
				select() {
					selectTables.push(table);

					return {
						order() {
							return Promise.resolve(responses.get(table) ?? { data: [], error: null });
						},
						then(resolve: (value: SelectResponse) => unknown) {
							return Promise.resolve(resolve(responses.get(table) ?? { data: [], error: null }));
						},
					};
				},
			};
		},
	};

	return { supabase, selectTables };
}

describe('useTerrain()', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('지형 fetch는 terrains_tiles 조회 없이 지형, 타일, 타일 상태만 로드한다.', async () => {
		const { supabase, selectTables } = createSupabaseMock();

		vi.doMock('./use-app.svelte', () => ({
			useApp: () => ({ supabase }),
		}));

		const { useTerrain } = await import('./use-terrain');
		const terrainStore = useTerrain();

		terrainStore.init();
		await terrainStore.fetch();

		expect(selectTables).toEqual(['terrains', 'tiles', 'tile_states']);
	});

	it('지형 훅 공개 API에서 terrain tile 전용 스토어와 admin CRUD가 제거된다.', async () => {
		const { supabase } = createSupabaseMock();

		vi.doMock('./use-app.svelte', () => ({
			useApp: () => ({ supabase }),
		}));

		const { useTerrain } = await import('./use-terrain');
		const terrainStore = useTerrain() as Record<string, unknown>;
		const admin = terrainStore.admin as Record<string, unknown>;

		expect(terrainStore).not.toHaveProperty('terrainTileStore');
		expect(terrainStore).not.toHaveProperty('fetchTerrainTiles');
		expect(admin).not.toHaveProperty('createTerrainTile');
		expect(admin).not.toHaveProperty('updateTerrainTile');
		expect(admin).not.toHaveProperty('removeTerrainTile');
	});
});
