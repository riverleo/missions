import { writable, get, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	Character,
	CharacterInsert,
	CharacterUpdate,
	CharacterFaceState,
	CharacterFaceStateInsert,
	CharacterFaceStateUpdate,
	CharacterInteraction,
	CharacterInteractionInsert,
	CharacterInteractionUpdate,
	CharacterInteractionAction,
	CharacterInteractionActionInsert,
	CharacterInteractionActionUpdate,
	CharacterBodyStateType,
	CharacterId,
	CharacterFaceStateId,
	CharacterInteractionId,
	CharacterInteractionActionId,
	ScenarioId,
} from '$lib/types';
import { useApp } from './use-app.svelte';

type CharacterDialogState =
	| { type: 'create' }
	| { type: 'update'; characterId: CharacterId }
	| { type: 'delete'; characterId: CharacterId }
	| undefined;

type CharacterFaceStateDialogState =
	| { type: 'update'; characterFaceStateId: CharacterFaceStateId }
	| undefined;

type CharacterInteractionDialogState =
	| { type: 'create' }
	| { type: 'update'; interactionId: CharacterInteractionId }
	| { type: 'delete'; interactionId: CharacterInteractionId }
	| undefined;

let instance: ReturnType<typeof createCharacterStore> | null = null;

function createCharacterStore() {
	const { supabase } = useApp();

	const store = writable<RecordFetchState<CharacterId, Character>>({
		status: 'idle',
		data: {},
	});

	// character_id를 키로, 해당 캐릭터의 face states 배열을 값으로
	const faceStateStore = writable<RecordFetchState<CharacterId, CharacterFaceState[]>>({
		status: 'idle',
		data: {},
	});

	// character_interaction_id를 키로 관리
	const characterInteractionStore = writable<RecordFetchState<CharacterInteractionId, CharacterInteraction>>({
		status: 'idle',
		data: {},
	});

	// character_interaction_id를 키로, 해당 interaction의 actions 배열을 값으로
	const characterInteractionActionStore = writable<
		RecordFetchState<CharacterInteractionId, CharacterInteractionAction[]>
	>({
		status: 'idle',
		data: {},
	});

	const dialogStore = writable<CharacterDialogState>(undefined);
	const faceStateDialogStore = writable<CharacterFaceStateDialogState>(undefined);
	const interactionDialogStore = writable<CharacterInteractionDialogState>(undefined);

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
		characterInteractionStore.update((state) => ({ ...state, status: 'loading' }));

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

			// Character interactions and actions
			const { data: interactionsData, error: interactionsError } = await supabase
				.from('character_interactions')
				.select('*, character_interaction_actions(*)')
				.eq('scenario_id', scenarioId)
				.order('created_at');

			if (interactionsError) throw interactionsError;

			const interactionRecord: Record<CharacterInteractionId, CharacterInteraction> = {};
			const actionRecord: Record<CharacterInteractionId, CharacterInteractionAction[]> = {};

			for (const item of interactionsData ?? []) {
				const { character_interaction_actions, ...interaction } = item;
				interactionRecord[item.id as CharacterInteractionId] = interaction as CharacterInteraction;
				actionRecord[item.id as CharacterInteractionId] = (character_interaction_actions ??
					[]) as CharacterInteractionAction[];
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

			characterInteractionStore.set({
				status: 'success',
				data: interactionRecord,
				error: undefined,
			});

			characterInteractionActionStore.set({
				status: 'success',
				data: actionRecord,
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
			characterInteractionStore.set({
				status: 'error',
				data: {},
				error: err,
			});
			characterInteractionActionStore.set({
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

	function openFaceStateDialog(state: NonNullable<CharacterFaceStateDialogState>) {
		faceStateDialogStore.set(state);
	}

	function closeFaceStateDialog() {
		faceStateDialogStore.set(undefined);
	}

	function openCharacterInteractionDialog(state: NonNullable<CharacterInteractionDialogState>) {
		interactionDialogStore.set(state);
	}

	function closeCharacterInteractionDialog() {
		interactionDialogStore.set(undefined);
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

		async createInteraction(interaction: Omit<CharacterInteractionInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useCharacter: currentScenarioId is not set.');
			}

			const { data, error } = await supabase
				.from('character_interactions')
				.insert({
					...interaction,
					scenario_id: currentScenarioId,
				})
				.select('*')
				.single<CharacterInteraction>();

			if (error) throw error;

			characterInteractionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as CharacterInteractionId] = data;
				})
			);

			characterInteractionActionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as CharacterInteractionId] = [];
				})
			);

			return data;
		},

		async updateInteraction(id: CharacterInteractionId, updates: CharacterInteractionUpdate) {
			const { error } = await supabase
				.from('character_interactions')
				.update(updates)
				.eq('id', id);

			if (error) throw error;

			characterInteractionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], updates);
					}
				})
			);
		},

		async removeInteraction(id: CharacterInteractionId) {
			const { error } = await supabase.from('character_interactions').delete().eq('id', id);

			if (error) throw error;

			characterInteractionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);

			characterInteractionActionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},

		async createInteractionAction(
			interactionId: CharacterInteractionId,
			action: Omit<CharacterInteractionActionInsert, 'scenario_id' | 'character_id' | 'target_character_id' | 'character_interaction_id'>
		) {
			if (!currentScenarioId) {
				throw new Error('useCharacter: currentScenarioId is not set.');
			}

			// Get character_id and target_character_id from interaction
			const characterInteractionStoreValue = get(characterInteractionStore);
			const interaction = characterInteractionStoreValue.data[interactionId];
			const characterId = interaction?.character_id;
			const targetCharacterId = interaction?.target_character_id;

			if (!targetCharacterId) {
				throw new Error('Cannot find target_character_id for this interaction');
			}

			const { data, error } = await supabase
				.from('character_interaction_actions')
				.insert({
					...action,
					scenario_id: currentScenarioId,
					character_id: characterId || targetCharacterId, // Use targetCharacterId as fallback if character_id is null
					target_character_id: targetCharacterId,
					character_interaction_id: interactionId,
				})
				.select()
				.single<CharacterInteractionAction>();

			if (error) throw error;

			characterInteractionActionStore.update((s) =>
				produce(s, (draft) => {
					if (draft.data[interactionId]) {
						draft.data[interactionId].push(data);
					} else {
						draft.data[interactionId] = [data];
					}
				})
			);

			return data;
		},

		async updateInteractionAction(
			actionId: CharacterInteractionActionId,
			interactionId: CharacterInteractionId,
			updates: CharacterInteractionActionUpdate
		) {
			const { error } = await supabase
				.from('character_interaction_actions')
				.update(updates)
				.eq('id', actionId);

			if (error) throw error;

			characterInteractionActionStore.update((s) =>
				produce(s, (draft) => {
					const actions = draft.data[interactionId];
					if (actions) {
						const action = actions.find((a) => a.id === actionId);
						if (action) {
							Object.assign(action, updates);
						}
					}
				})
			);
		},

		async removeInteractionAction(
			actionId: CharacterInteractionActionId,
			interactionId: CharacterInteractionId
		) {
			const { error } = await supabase
				.from('character_interaction_actions')
				.delete()
				.eq('id', actionId);

			if (error) throw error;

			characterInteractionActionStore.update((s) =>
				produce(s, (draft) => {
					const actions = draft.data[interactionId];
					if (actions) {
						draft.data[interactionId] = actions.filter((a) => a.id !== actionId);
					}
				})
			);
		},
	};

	return {
		store: store as Readable<RecordFetchState<CharacterId, Character>>,
		faceStateStore: faceStateStore as Readable<RecordFetchState<CharacterId, CharacterFaceState[]>>,
		characterInteractionStore: characterInteractionStore as Readable<
			RecordFetchState<CharacterInteractionId, CharacterInteraction>
		>,
		characterInteractionActionStore: characterInteractionActionStore as Readable<
			RecordFetchState<CharacterInteractionId, CharacterInteractionAction[]>
		>,
		dialogStore: dialogStore as Readable<CharacterDialogState>,
		faceStateDialogStore: faceStateDialogStore as Readable<CharacterFaceStateDialogState>,
		interactionDialogStore: interactionDialogStore as Readable<CharacterInteractionDialogState>,
		init,
		fetch,
		openDialog,
		closeDialog,
		openFaceStateDialog,
		closeFaceStateDialog,
		openCharacterInteractionDialog,
		closeCharacterInteractionDialog,
		admin,
	};
}

export function useCharacter() {
	if (!instance) {
		instance = createCharacterStore();
	}
	return instance;
}
