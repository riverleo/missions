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
	CharacterId,
	CharacterFaceStateId,
	ScenarioId,
} from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

type CharacterDialogState =
	| { type: 'create' }
	| { type: 'update'; characterId: CharacterId }
	| { type: 'delete'; characterId: CharacterId }
	| undefined;

let instance: ReturnType<typeof createCharacterStore> | null = null;

function createCharacterStore() {
	const { supabase } = useServerPayload();

	const store = writable<RecordFetchState<CharacterId, Character>>({
		status: 'idle',
		data: {},
	});

	// character_id를 키로, 해당 캐릭터의 face states 배열을 값으로
	const faceStateStore = writable<RecordFetchState<CharacterId, CharacterFaceState[]>>({
		status: 'idle',
		data: {},
	});

	const dialogStore = writable<CharacterDialogState>(undefined);

	const uiStore = writable<{
		previewBodyStateType: CharacterBodyStateType;
	}>({
		previewBodyStateType: 'idle',
	});

	let initialized = false;
	let currentScenarioId: ScenarioId | undefined;

	function init() {
		initialized = true;
	}

	async function fetch(scenarioId: ScenarioId) {
		if (!initialized) {
			throw new Error('useCharacter not initialized. Call init() first.');
		}
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

			const characterRecord: Record<CharacterId, Character> = {};
			const faceStateRecord: Record<CharacterId, CharacterFaceState[]> = {};

			for (const item of data ?? []) {
				const { character_face_states, ...character } = item;
				characterRecord[item.id as CharacterId] = character as Character;
				faceStateRecord[item.id as CharacterId] = (character_face_states ??
					[]) as CharacterFaceState[];
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
				.single<Character>();

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as CharacterId] = data;
				})
			);

			faceStateStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as CharacterId] = [];
				})
			);

			return data;
		},

		async update(id: CharacterId, character: CharacterUpdate) {
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

		async remove(id: CharacterId) {
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
			characterId: CharacterId,
			state: Omit<CharacterFaceStateInsert, 'character_id'>
		) {
			const { data, error } = await supabase
				.from('character_face_states')
				.insert({
					...state,
					character_id: characterId,
				})
				.select()
				.single<CharacterFaceState>();

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
			stateId: CharacterFaceStateId,
			characterId: CharacterId,
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

		async removeCharacterFaceState(stateId: CharacterFaceStateId, characterId: CharacterId) {
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
		store: store as Readable<RecordFetchState<CharacterId, Character>>,
		faceStateStore: faceStateStore as Readable<RecordFetchState<CharacterId, CharacterFaceState[]>>,
		dialogStore: dialogStore as Readable<CharacterDialogState>,
		init,
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
