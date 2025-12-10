import { writable, type Readable } from 'svelte/store';
import type { FetchState, DiceRoll, DiceRollInsert } from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

let instance: ReturnType<typeof createDiceRollStore> | undefined = undefined;

function createDiceRollStore() {
	const { supabase } = useServerPayload();
	const store = writable<FetchState<DiceRoll[]>>({
		status: 'idle',
		data: undefined,
		error: undefined,
	});

	let initialized = false;

	async function fetchDiceRolls() {
		store.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase.from('dice_rolls').select('*');

			if (error) throw error;

			store.set({
				status: 'success',
				data: data ?? [],
				error: undefined,
			});
		} catch (error) {
			store.set({
				status: 'error',
				data: undefined,
				error: error instanceof Error ? error : new Error('Unknown error'),
			});
		}
	}

	async function create(diceRoll: DiceRollInsert) {
		try {
			const { data, error } = await supabase
				.from('dice_rolls')
				.insert(diceRoll)
				.select()
				.single();

			if (error) throw error;

			await fetchDiceRolls();
			return data;
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	async function update(id: string, diceRoll: Partial<DiceRollInsert>) {
		try {
			const { error } = await supabase.from('dice_rolls').update(diceRoll).eq('id', id);

			if (error) throw error;

			await fetchDiceRolls();
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	async function remove(id: string) {
		try {
			const { error } = await supabase.from('dice_rolls').delete().eq('id', id);

			if (error) throw error;

			await fetchDiceRolls();
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	function find(id: string): DiceRoll | undefined {
		const currentState = writable<DiceRoll | undefined>(undefined);
		store.subscribe((state) => {
			if (state.data) {
				currentState.set(state.data.find((dr) => dr.id === id));
			}
		});
		let result: DiceRoll | undefined;
		currentState.subscribe((value) => {
			result = value;
		});
		return result;
	}

	if (!initialized) {
		initialized = true;
		fetchDiceRolls();
	}

	return {
		store: store as Readable<FetchState<DiceRoll[]>>,
		find,
		admin: {
			create,
			update,
			remove,
		},
	};
}

export function useDiceRoll() {
	if (!instance) {
		instance = createDiceRollStore();
	}
	return instance;
}
