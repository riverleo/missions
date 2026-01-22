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
	CharacterBody,
	CharacterBodyInsert,
	CharacterBodyUpdate,
	CharacterBodyState,
	CharacterBodyStateInsert,
	CharacterBodyStateUpdate,
	CharacterBodyStateType,
	CharacterId,
	CharacterFaceStateId,
	CharacterInteractionId,
	CharacterInteractionActionId,
	CharacterBodyId,
	CharacterBodyStateId,
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

type CharacterBodyDialogState =
	| { type: 'create' }
	| { type: 'delete'; bodyId: CharacterBodyId }
	| undefined;

let instance: ReturnType<typeof createCharacterStore> | null = null;

function createCharacterStore() {
	const { supabase } = useApp();

	const characterStore = writable<RecordFetchState<CharacterId, Character>>({
		status: 'idle',
		data: {},
	});

	// character_id를 키로, 해당 캐릭터의 face states 배열을 값으로
	const characterFaceStateStore = writable<RecordFetchState<CharacterId, CharacterFaceState[]>>({
		status: 'idle',
		data: {},
	});

	// character_interaction_id를 키로 관리
	const characterInteractionStore = writable<
		RecordFetchState<CharacterInteractionId, CharacterInteraction>
	>({
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

	const characterDialogStore = writable<CharacterDialogState>(undefined);
	const characterFaceStateDialogStore = writable<CharacterFaceStateDialogState>(undefined);
	const characterInteractionDialogStore = writable<CharacterInteractionDialogState>(undefined);

	const characterBodyStore = writable<RecordFetchState<CharacterBodyId, CharacterBody>>({
		status: 'idle',
		data: {},
	});

	// body_id를 키로, 해당 바디의 states 배열을 값으로
	const characterBodyStateStore = writable<RecordFetchState<CharacterBodyId, CharacterBodyState[]>>(
		{
			status: 'idle',
			data: {},
		}
	);

	const characterBodyDialogStore = writable<CharacterBodyDialogState>(undefined);

	const characterUiStore = writable<{
		previewBodyStateType: CharacterBodyStateType;
		showBodyPreview: boolean;
	}>({
		previewBodyStateType: 'idle',
		showBodyPreview: false,
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

		characterStore.update((state) => ({ ...state, status: 'loading' }));
		characterInteractionStore.update((state) => ({ ...state, status: 'loading' }));
		characterBodyStore.update((state) => ({ ...state, status: 'loading' }));

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

			// Character bodies and states
			const { data: bodiesData, error: bodiesError } = await supabase
				.from('character_bodies')
				.select('*, character_body_states(*)')
				.eq('scenario_id', scenarioId)
				.order('name');

			if (bodiesError) throw bodiesError;

			const bodyRecord: Record<CharacterBodyId, CharacterBody> = {};
			const bodyStateRecord: Record<CharacterBodyId, CharacterBodyState[]> = {};

			for (const item of bodiesData ?? []) {
				const { character_body_states, ...body } = item;
				bodyRecord[item.id as CharacterBodyId] = body as CharacterBody;
				bodyStateRecord[item.id as CharacterBodyId] = (character_body_states ??
					[]) as CharacterBodyState[];
			}

			characterStore.set({
				status: 'success',
				data: characterRecord,
				error: undefined,
			});

			characterFaceStateStore.set({
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

			characterBodyStore.set({
				status: 'success',
				data: bodyRecord,
				error: undefined,
			});

			characterBodyStateStore.set({
				status: 'success',
				data: bodyStateRecord,
				error: undefined,
			});
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			characterStore.set({
				status: 'error',
				data: {},
				error: err,
			});
			characterFaceStateStore.set({
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
			characterBodyStore.set({
				status: 'error',
				data: {},
				error: err,
			});
			characterBodyStateStore.set({
				status: 'error',
				data: {},
				error: err,
			});
		}
	}

	function openCharacterDialog(state: NonNullable<CharacterDialogState>) {
		characterDialogStore.set(state);
	}

	function closeCharacterDialog() {
		characterDialogStore.set(undefined);
	}

	function openCharacterFaceStateDialog(state: NonNullable<CharacterFaceStateDialogState>) {
		characterFaceStateDialogStore.set(state);
	}

	function closeCharacterFaceStateDialog() {
		characterFaceStateDialogStore.set(undefined);
	}

	function openCharacterInteractionDialog(state: NonNullable<CharacterInteractionDialogState>) {
		characterInteractionDialogStore.set(state);
	}

	function closeCharacterInteractionDialog() {
		characterInteractionDialogStore.set(undefined);
	}

	function openCharacterBodyDialog(state: NonNullable<CharacterBodyDialogState>) {
		characterBodyDialogStore.set(state);
	}

	function closeCharacterBodyDialog() {
		characterBodyDialogStore.set(undefined);
	}

	const admin = {
		characterUiStore: characterUiStore as Readable<{
			previewBodyStateType: CharacterBodyStateType;
			showBodyPreview: boolean;
		}>,

		setPreviewBodyStateType(value: CharacterBodyStateType) {
			characterUiStore.update((s) => ({ ...s, previewBodyStateType: value }));
		},

		setShowBodyPreview(value: boolean) {
			characterUiStore.update((s) => ({ ...s, showBodyPreview: value }));
		},

		async createCharacter(character: Omit<CharacterInsert, 'scenario_id'>) {
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

			characterStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as CharacterId] = data;
				})
			);

			characterFaceStateStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as CharacterId] = [];
				})
			);

			return data;
		},

		async updateCharacter(id: CharacterId, character: CharacterUpdate) {
			const { error } = await supabase.from('characters').update(character).eq('id', id);

			if (error) throw error;

			characterStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], character);
					}
				})
			);
		},

		async removeCharacter(id: CharacterId) {
			const { error } = await supabase.from('characters').delete().eq('id', id);

			if (error) throw error;

			characterStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);

			characterFaceStateStore.update((state) =>
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

			characterFaceStateStore.update((s) =>
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

			characterFaceStateStore.update((s) =>
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

			characterFaceStateStore.update((s) =>
				produce(s, (draft) => {
					const states = draft.data[characterId];
					if (states) {
						draft.data[characterId] = states.filter((cs) => cs.id !== stateId);
					}
				})
			);
		},

		async createCharacterInteraction(interaction: Omit<CharacterInteractionInsert, 'scenario_id'>) {
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

		async updateCharacterInteraction(
			id: CharacterInteractionId,
			updates: CharacterInteractionUpdate
		) {
			const { error } = await supabase.from('character_interactions').update(updates).eq('id', id);

			if (error) throw error;

			characterInteractionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], updates);
					}
				})
			);
		},

		async removeCharacterInteraction(id: CharacterInteractionId) {
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

		async createCharacterInteractionAction(
			interactionId: CharacterInteractionId,
			action: Omit<
				CharacterInteractionActionInsert,
				'scenario_id' | 'character_id' | 'target_character_id' | 'character_interaction_id'
			>
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

		async updateCharacterInteractionAction(
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

		async removeCharacterInteractionAction(
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

		async createCharacterBody(body: Omit<CharacterBodyInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useCharacter: currentScenarioId is not set.');
			}

			const { data, error } = await supabase
				.from('character_bodies')
				.insert({
					...body,
					scenario_id: currentScenarioId,
				})
				.select('*')
				.single<CharacterBody>();

			if (error) throw error;

			characterBodyStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as CharacterBodyId] = data;
				})
			);

			characterBodyStateStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as CharacterBodyId] = [];
				})
			);

			return data;
		},

		async updateCharacterBody(id: CharacterBodyId, body: CharacterBodyUpdate) {
			const { error } = await supabase.from('character_bodies').update(body).eq('id', id);

			if (error) throw error;

			characterBodyStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], body);
					}
				})
			);
		},

		async removeCharacterBody(id: CharacterBodyId) {
			const { error } = await supabase.from('character_bodies').delete().eq('id', id);

			if (error) throw error;

			characterBodyStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);

			characterBodyStateStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},

		async createCharacterBodyState(
			bodyId: CharacterBodyId,
			state: Omit<CharacterBodyStateInsert, 'body_id'>
		) {
			const { data, error } = await supabase
				.from('character_body_states')
				.insert({
					...state,
					body_id: bodyId,
				})
				.select()
				.single<CharacterBodyState>();

			if (error) throw error;

			characterBodyStateStore.update((s) =>
				produce(s, (draft) => {
					if (draft.data[bodyId]) {
						draft.data[bodyId].push(data);
					} else {
						draft.data[bodyId] = [data];
					}
				})
			);

			return data;
		},

		async updateCharacterBodyState(
			stateId: CharacterBodyStateId,
			bodyId: CharacterBodyId,
			updates: CharacterBodyStateUpdate
		) {
			const { error } = await supabase
				.from('character_body_states')
				.update(updates)
				.eq('id', stateId);

			if (error) throw error;

			characterBodyStateStore.update((s) =>
				produce(s, (draft) => {
					const states = draft.data[bodyId];
					if (states) {
						const state = states.find((cs) => cs.id === stateId);
						if (state) {
							Object.assign(state, updates);
						}
					}
				})
			);
		},

		async removeCharacterBodyState(stateId: CharacterBodyStateId, bodyId: CharacterBodyId) {
			const { error } = await supabase.from('character_body_states').delete().eq('id', stateId);

			if (error) throw error;

			characterBodyStateStore.update((s) =>
				produce(s, (draft) => {
					const states = draft.data[bodyId];
					if (states) {
						draft.data[bodyId] = states.filter((cs) => cs.id !== stateId);
					}
				})
			);
		},
	};

	return {
		characterStore: characterStore as Readable<RecordFetchState<CharacterId, Character>>,
		characterFaceStateStore: characterFaceStateStore as Readable<
			RecordFetchState<CharacterId, CharacterFaceState[]>
		>,
		characterInteractionStore: characterInteractionStore as Readable<
			RecordFetchState<CharacterInteractionId, CharacterInteraction>
		>,
		characterInteractionActionStore: characterInteractionActionStore as Readable<
			RecordFetchState<CharacterInteractionId, CharacterInteractionAction[]>
		>,
		characterBodyStore: characterBodyStore as Readable<
			RecordFetchState<CharacterBodyId, CharacterBody>
		>,
		characterBodyStateStore: characterBodyStateStore as Readable<
			RecordFetchState<CharacterBodyId, CharacterBodyState[]>
		>,
		characterDialogStore: characterDialogStore as Readable<CharacterDialogState>,
		characterFaceStateDialogStore:
			characterFaceStateDialogStore as Readable<CharacterFaceStateDialogState>,
		characterInteractionDialogStore:
			characterInteractionDialogStore as Readable<CharacterInteractionDialogState>,
		characterBodyDialogStore: characterBodyDialogStore as Readable<CharacterBodyDialogState>,
		init,
		fetch,
		openCharacterDialog,
		closeCharacterDialog,
		openCharacterFaceStateDialog,
		closeCharacterFaceStateDialog,
		openCharacterInteractionDialog,
		closeCharacterInteractionDialog,
		openCharacterBodyDialog,
		closeCharacterBodyDialog,
		admin,
	};
}

export function useCharacter() {
	if (!instance) {
		instance = createCharacterStore();
	}
	return instance;
}
