import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	Character,
	CharacterInsert,
	CharacterUpdate,
	CharacterFaceState,
	CharacterFaceStateInsert,
	CharacterFaceStateUpdate,
	CharacterBodyStateType,
} from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

type CharacterDialogState =
	| { type: 'create' }
	| { type: 'update'; characterId: string }
	| { type: 'delete'; characterId: string }
	| undefined;

let instance: ReturnType<typeof createCharacterStore> | null = null;

function createCharacterStore() {
	const { supabase } = useServerPayload();

	const store = writable<RecordFetchState<Character>>({
		status: 'idle',
		data: {},
	});

	// character_id를 키로, 해당 캐릭터의 face states 배열을 값으로
	const faceStateStore = writable<RecordFetchState<CharacterFaceState[]>>({
		status: 'idle',
		data: {},
	});

	const dialogStore = writable<CharacterDialogState>(undefined);

	const uiStore = writable<{
		previewBodyStateType: CharacterBodyStateType;
	}>({
		previewBodyStateType: 'idle',
	});

	let currentScenarioId: string | undefined;

	async function fetch(scenarioId: string) {
		currentScenarioId = scenarioId;

		store.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase
				.from('characters')
				.select(
					`
					*,
					character_face_states(*)
				`
				)
				.eq('scenario_id', scenarioId)
				.order('name');

			if (error) throw error;

			const characterRecord: Record<string, Character> = {};
			const faceStateRecord: Record<string, CharacterFaceState[]> = {};

			for (const item of data ?? []) {
				const { character_face_states, ...character } = item;
				characterRecord[item.id] = character;
				faceStateRecord[item.id] = character_face_states ?? [];
			}

			store.set({
				status: 'success',
				data: characterRecord,
				error: undefined,
			});

			faceStateStore.set({
				status: 'success',
				data: faceStateRecord,
				error: undefined,
			});
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			store.set({
				status: 'error',
				data: {},
				error: err,
			});
			faceStateStore.set({
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
		uiStore: uiStore as Readable<{
			previewBodyStateType: CharacterBodyStateType;
		}>,

		setPreviewBodyStateType(value: CharacterBodyStateType) {
			uiStore.update((s) => ({ ...s, previewBodyStateType: value }));
		},

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
				.select('*')
				.single();

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id] = data;
				})
			);

			faceStateStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id] = [];
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

			faceStateStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},

		async createCharacterFaceState(
			characterId: string,
			state: Omit<CharacterFaceStateInsert, 'character_id'>
		) {
			const { data, error } = await supabase
				.from('character_face_states')
				.insert({
					...state,
					character_id: characterId,
				})
				.select()
				.single();

			if (error) throw error;

			faceStateStore.update((s) =>
				produce(s, (draft) => {
					if (draft.data[characterId]) {
						draft.data[characterId].push(data);
					} else {
						draft.data[characterId] = [data];
					}
				})
			);

			return data;
		},

		async updateCharacterFaceState(
			stateId: string,
			characterId: string,
			updates: CharacterFaceStateUpdate
		) {
			const { error } = await supabase
				.from('character_face_states')
				.update(updates)
				.eq('id', stateId);

			if (error) throw error;

			faceStateStore.update((s) =>
				produce(s, (draft) => {
					const states = draft.data[characterId];
					if (states) {
						const state = states.find((cs) => cs.id === stateId);
						if (state) {
							Object.assign(state, updates);
						}
					}
				})
			);
		},

		async removeCharacterFaceState(stateId: string, characterId: string) {
			const { error } = await supabase.from('character_face_states').delete().eq('id', stateId);

			if (error) throw error;

			faceStateStore.update((s) =>
				produce(s, (draft) => {
					const states = draft.data[characterId];
					if (states) {
						draft.data[characterId] = states.filter((cs) => cs.id !== stateId);
					}
				})
			);
		},
	};

	return {
		store: store as Readable<RecordFetchState<Character>>,
		faceStateStore: faceStateStore as Readable<RecordFetchState<CharacterFaceState[]>>,
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
