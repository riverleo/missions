import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	CharacterBody,
	CharacterBodyInsert,
	CharacterBodyUpdate,
	CharacterBodyStateInsert,
	CharacterBodyStateUpdate,
} from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

type CharacterBodyDialogState =
	| { type: 'create' }
	| { type: 'delete'; bodyId: string }
	| undefined;

let instance: ReturnType<typeof createCharacterBodyStore> | null = null;

function createCharacterBodyStore() {
	const { supabase } = useServerPayload();

	const store = writable<RecordFetchState<CharacterBody>>({
		status: 'idle',
		data: {},
	});

	const dialogStore = writable<CharacterBodyDialogState>(undefined);

	const uiStore = writable({
		showBodyPreview: false,
	});

	let currentScenarioId: string | undefined;

	async function fetch(scenarioId: string) {
		currentScenarioId = scenarioId;

		store.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase
				.from('character_bodies')
				.select('*, character_body_states(*)')
				.eq('scenario_id', scenarioId)
				.order('name');

			if (error) throw error;

			const record: Record<string, CharacterBody> = {};
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

	function openDialog(state: NonNullable<CharacterBodyDialogState>) {
		dialogStore.set(state);
	}

	function closeDialog() {
		dialogStore.set(undefined);
	}

	const admin = {
		uiStore: uiStore as Readable<{ showBodyPreview: boolean }>,

		setShowBodyPreview(value: boolean) {
			uiStore.update((s) => ({ ...s, showBodyPreview: value }));
		},

		async create(body: Omit<CharacterBodyInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useCharacterBody: currentScenarioId is not set.');
			}

			const { data, error } = await supabase
				.from('character_bodies')
				.insert({
					...body,
					scenario_id: currentScenarioId,
				})
				.select('*, character_body_states(*)')
				.single();

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id] = data;
				})
			);

			return data;
		},

		async update(id: string, body: CharacterBodyUpdate) {
			const { error } = await supabase.from('character_bodies').update(body).eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], body);
					}
				})
			);
		},

		async remove(id: string) {
			const { error } = await supabase.from('character_bodies').delete().eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},

		async createCharacterBodyState(
			bodyId: string,
			state: Omit<CharacterBodyStateInsert, 'body_id'>
		) {
			const { data, error } = await supabase
				.from('character_body_states')
				.insert({
					...state,
					body_id: bodyId,
				})
				.select()
				.single();

			if (error) throw error;

			store.update((s) =>
				produce(s, (draft) => {
					const body = draft.data[bodyId];
					if (body) {
						body.character_body_states.push(data);
					}
				})
			);

			return data;
		},

		async updateCharacterBodyState(
			stateId: string,
			bodyId: string,
			updates: CharacterBodyStateUpdate
		) {
			const { error } = await supabase
				.from('character_body_states')
				.update(updates)
				.eq('id', stateId);

			if (error) throw error;

			store.update((s) =>
				produce(s, (draft) => {
					const body = draft.data[bodyId];
					if (body) {
						const state = body.character_body_states.find((cs) => cs.id === stateId);
						if (state) {
							Object.assign(state, updates);
						}
					}
				})
			);
		},

		async removeCharacterBodyState(stateId: string, bodyId: string) {
			const { error } = await supabase.from('character_body_states').delete().eq('id', stateId);

			if (error) throw error;

			store.update((s) =>
				produce(s, (draft) => {
					const body = draft.data[bodyId];
					if (body) {
						body.character_body_states = body.character_body_states.filter(
							(cs) => cs.id !== stateId
						);
					}
				})
			);
		},
	};

	return {
		store: store as Readable<RecordFetchState<CharacterBody>>,
		dialogStore: dialogStore as Readable<CharacterBodyDialogState>,
		fetch,
		openDialog,
		closeDialog,
		admin,
	};
}

export function useCharacterBody() {
	if (!instance) {
		instance = createCharacterBodyStore();
	}
	return instance;
}
