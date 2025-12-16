import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type { RecordFetchState, Character, CharacterInsert, CharacterUpdate } from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

type CharacterDialogState =
	| { type: 'create' }
	| { type: 'delete'; characterId: string }
	| undefined;

let instance: ReturnType<typeof createCharacterStore> | null = null;

function createCharacterStore() {
	const { supabase } = useServerPayload();

	const store = writable<RecordFetchState<Character>>({
		status: 'idle',
		data: {},
	});

	const dialogStore = writable<CharacterDialogState>(undefined);

	let currentScenarioId: string | undefined;

	async function fetch(scenarioId: string) {
		currentScenarioId = scenarioId;

		store.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase
				.from('characters')
				.select('*')
				.eq('scenario_id', scenarioId)
				.order('display_order');

			if (error) throw error;

			const record: Record<string, Character> = {};
			for (const item of data ?? []) {
				record[item.id] = item;
			}

			store.set({
				status: 'success',
				data: record,
				error: undefined,
			});
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			store.set({
				status: 'error',
				data: {},
				error: err,
			});
		}
	}

	function openDialog(state: NonNullable<CharacterDialogState>) {
		dialogStore.set(state);
	}

	function closeDialog() {
		dialogStore.set(undefined);
	}

	const admin = {
		async create(character: Omit<CharacterInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useCharacter: currentScenarioId is not set.');
			}

			const { data, error } = await supabase
				.from('characters')
				.insert({
					...character,
					scenario_id: currentScenarioId,
				})
				.select()
				.single();

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id] = data;
				})
			);

			return data;
		},

		async update(id: string, character: CharacterUpdate) {
			const { error } = await supabase.from('characters').update(character).eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], character);
					}
				})
			);
		},

		async remove(id: string) {
			const { error } = await supabase.from('characters').delete().eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},
	};

	return {
		store: store as Readable<RecordFetchState<Character>>,
		dialogStore: dialogStore as Readable<CharacterDialogState>,
		fetch,
		openDialog,
		closeDialog,
		admin,
	};
}

export function useCharacter() {
	if (!instance) {
		instance = createCharacterStore();
	}
	return instance;
}
