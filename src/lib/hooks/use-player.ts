import { writable, derived, type Readable } from 'svelte/store';
import type { RecordFetchState, Player, PlayerId } from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

type PlayerStoreState = RecordFetchState<PlayerId, Player>;

let instance: ReturnType<typeof createPlayerStore> | null = null;
let initialized = false;

function createPlayerStore() {
	const { supabase, user } = useServerPayload();

	const store = writable<PlayerStoreState>({ status: 'idle', data: {} });

	const current = derived(store, ($store) => {
		const players = Object.values($store.data);
		return players[0];
	});

	function init() {
		initialized = true;
	}

	async function fetch() {
		if (!initialized) {
			throw new Error('usePlayer not initialized. Call init() first.');
		}

		store.update((state) => ({ ...state, status: 'loading' }));

		if (!user) return;

		try {
			// Player 조회 (user_id로 필터링, deleted_at이 null인 것만)
			const { data, error } = await supabase
				.from('players')
				.select('*')
				.eq('user_id', user.id)
				.is('deleted_at', null)
				.maybeSingle<Player>();

			if (error) throw error;

			// Record로 변환
			const record: Record<PlayerId, Player> = {};
			if (data) {
				record[data.id] = data;
			}

			store.update((state) => ({
				...state,
				status: 'success',
				data: record,
				error: undefined,
			}));
		} catch (error) {
			store.update((state) => ({
				...state,
				status: 'error',
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
		}
	}

	return {
		store: store as Readable<PlayerStoreState>,
		current: current as Readable<Player | undefined>,
		init,
		fetch,
	};
}

export function usePlayer() {
	if (!instance) {
		instance = createPlayerStore();
	}
	return instance;
}
