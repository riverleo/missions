import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	Player,
	PlayerId,
	PlayerInsert,
	PlayerScenario,
	PlayerScenarioId,
} from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

type PlayerStoreState = RecordFetchState<PlayerId, Player>;
type PlayerScenarioStoreState = RecordFetchState<PlayerScenarioId, PlayerScenario>;

let instance: ReturnType<typeof createPlayerStore> | null = null;
let initialized = false;

function createPlayerStore() {
	const { supabase, user } = useServerPayload();

	const store = writable<PlayerStoreState>({ status: 'idle', data: {} });
	const playerScenarioStore = writable<PlayerScenarioStoreState>({ status: 'idle', data: {} });

	function init() {
		initialized = true;
	}

	async function fetch() {
		if (!initialized) {
			throw new Error('usePlayer not initialized. Call init() first.');
		}

		store.update((state) => ({ ...state, status: 'loading' }));
		playerScenarioStore.update((state) => ({ ...state, status: 'loading' }));

		if (!user) return;

		try {
			// Player와 PlayerScenario를 함께 조회
			const [playerResult, playerScenariosResult] = await Promise.all([
				supabase
					.from('players')
					.select('*')
					.eq('user_id', user.id)
					.is('deleted_at', null)
					.maybeSingle<Player>(),
				supabase.from('player_scenarios').select('*').eq('user_id', user.id),
			]);

			if (playerResult.error) throw playerResult.error;
			if (playerScenariosResult.error) throw playerScenariosResult.error;

			// Player Record로 변환
			const playerRecord: Record<PlayerId, Player> = {};
			if (playerResult.data) {
				playerRecord[playerResult.data.id] = playerResult.data;
			}

			// PlayerScenario Record로 변환
			const playerScenarioRecord: Record<PlayerScenarioId, PlayerScenario> = {};
			for (const item of playerScenariosResult.data ?? []) {
				playerScenarioRecord[item.id as PlayerScenarioId] = item as PlayerScenario;
			}

			store.set({
				status: 'success',
				data: playerRecord,
				error: undefined,
			});

			playerScenarioStore.set({
				status: 'success',
				data: playerScenarioRecord,
				error: undefined,
			});
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');

			store.set({
				status: 'error',
				data: {},
				error: err,
			});

			playerScenarioStore.set({
				status: 'error',
				data: {},
				error: err,
			});
		}
	}

	async function updatePlayerScenarioTick(playerScenarioId: PlayerScenarioId, currentTick: number) {
		const { error } = await supabase
			.from('player_scenarios')
			.update({ current_tick: currentTick })
			.eq('id', playerScenarioId);

		if (error) throw error;

		// 로컬 스토어 업데이트
		playerScenarioStore.update((state) =>
			produce(state, (draft) => {
				if (draft.data?.[playerScenarioId]) {
					draft.data[playerScenarioId].current_tick = currentTick;
				}
			})
		);
	}

	async function create(playerInsert: PlayerInsert) {
		const { data, error } = await supabase
			.from('players')
			.insert({ ...playerInsert })
			.select()
			.single<Player>();

		if (error) throw error;

		// 로컬 스토어 업데이트
		store.update((state) =>
			produce(state, (draft) => {
				draft.data[data.id] = data;
			})
		);

		return data;
	}

	return {
		store,
		playerScenarioStore,
		init,
		fetch,
		updatePlayerScenarioTick,
		create,
	};
}

export function usePlayer() {
	if (!instance) {
		instance = createPlayerStore();
	}
	return instance;
}
