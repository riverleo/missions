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
	Need,
	NeedInsert,
	NeedUpdate,
	NeedFulfillment,
	NeedFulfillmentInsert,
	NeedFulfillmentUpdate,
	CharacterNeed,
	CharacterNeedInsert,
	CharacterNeedUpdate,
	CharacterId,
	CharacterFaceStateId,
	CharacterInteractionId,
	CharacterInteractionActionId,
	CharacterBodyId,
	CharacterBodyStateId,
	NeedId,
	NeedFulfillmentId,
	CharacterNeedId,
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
	| { type: 'update'; characterInteractionId: CharacterInteractionId }
	| { type: 'delete'; characterInteractionId: CharacterInteractionId }
	| undefined;

type CharacterBodyDialogState =
	| { type: 'create' }
	| { type: 'delete'; bodyId: CharacterBodyId }
	| undefined;

type NeedDialogState =
	| { type: 'create' }
	| { type: 'update'; needId: NeedId }
	| { type: 'delete'; needId: NeedId }
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

	const needStore = writable<RecordFetchState<NeedId, Need>>({
		status: 'idle',
		data: {},
	});

	const needFulfillmentStore = writable<RecordFetchState<NeedFulfillmentId, NeedFulfillment>>({
		status: 'idle',
		data: {},
	});

	const characterNeedStore = writable<RecordFetchState<CharacterNeedId, CharacterNeed>>({
		status: 'idle',
		data: {},
	});

	const needDialogStore = writable<NeedDialogState>(undefined);

	const characterUiStore = writable<{
		previewBodyStateType: CharacterBodyStateType;
		showBodyPreview: boolean;
	}>({
		previewBodyStateType: 'idle',
		showBodyPreview: false,
	});

	let initialized = false;

	function init() {
		initialized = true;
	}

	async function fetch() {
		if (!initialized) {
			throw new Error('useCharacter not initialized. Call init() first.');
		}

		characterStore.update((state) => ({ ...state, status: 'loading' }));
		characterInteractionStore.update((state) => ({ ...state, status: 'loading' }));
		characterBodyStore.update((state) => ({ ...state, status: 'loading' }));
		needStore.update((state) => ({ ...state, status: 'loading' }));
		needFulfillmentStore.update((state) => ({ ...state, status: 'loading' }));
		characterNeedStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const [
				charactersResult,
				interactionsResult,
				bodiesResult,
				needsResult,
				fulfillmentsResult,
				characterNeedsResult,
			] = await Promise.all([
				supabase.from('characters').select('*, character_face_states(*)').order('name'),
				supabase.from('character_interactions').select('*, character_interaction_actions(*)').order('created_at'),
				supabase.from('character_bodies').select('*, character_body_states(*)').order('name'),
				supabase.from('needs').select('*').order('name'),
				supabase.from('need_fulfillments').select('*'),
				supabase.from('character_needs').select('*'),
			]);

			if (charactersResult.error) throw charactersResult.error;
			if (interactionsResult.error) throw interactionsResult.error;
			if (bodiesResult.error) throw bodiesResult.error;
			if (needsResult.error) throw needsResult.error;
			if (fulfillmentsResult.error) throw fulfillmentsResult.error;
			if (characterNeedsResult.error) throw characterNeedsResult.error;

			// Characters
			const characterRecord: Record<CharacterId, Character> = {};
			const faceStateRecord: Record<CharacterId, CharacterFaceState[]> = {};

			for (const item of charactersResult.data ?? []) {
				const { character_face_states, ...character } = item;
				characterRecord[item.id as CharacterId] = character as Character;
				faceStateRecord[item.id as CharacterId] = (character_face_states ??
					[]) as CharacterFaceState[];
			}

			// Character interactions and actions
			const interactionRecord: Record<CharacterInteractionId, CharacterInteraction> = {};
			const actionRecord: Record<CharacterInteractionId, CharacterInteractionAction[]> = {};

			for (const item of interactionsResult.data ?? []) {
				const { character_interaction_actions, ...interaction } = item;
				interactionRecord[item.id as CharacterInteractionId] = interaction as CharacterInteraction;
				actionRecord[item.id as CharacterInteractionId] = (character_interaction_actions ??
					[]) as CharacterInteractionAction[];
			}

			// Character bodies and states
			const bodyRecord: Record<CharacterBodyId, CharacterBody> = {};
			const bodyStateRecord: Record<CharacterBodyId, CharacterBodyState[]> = {};

			for (const item of bodiesResult.data ?? []) {
				const { character_body_states, ...body } = item;
				bodyRecord[item.id as CharacterBodyId] = body as CharacterBody;
				bodyStateRecord[item.id as CharacterBodyId] = (character_body_states ??
					[]) as CharacterBodyState[];
			}

			// Needs
			const needRecord: Record<NeedId, Need> = {};
			for (const item of needsResult.data ?? []) {
				needRecord[item.id as NeedId] = item as Need;
			}

			// Need fulfillments
			const fulfillmentRecord: Record<NeedFulfillmentId, NeedFulfillment> = {};
			for (const item of fulfillmentsResult.data ?? []) {
				fulfillmentRecord[item.id as NeedFulfillmentId] = item as NeedFulfillment;
			}

			// Character needs
			const characterNeedRecord: Record<CharacterNeedId, CharacterNeed> = {};
			for (const item of characterNeedsResult.data ?? []) {
				characterNeedRecord[item.id as CharacterNeedId] = item as CharacterNeed;
			}

			characterStore.set({ status: 'success', data: characterRecord, error: undefined });
			characterFaceStateStore.set({ status: 'success', data: faceStateRecord, error: undefined });
			characterInteractionStore.set({ status: 'success', data: interactionRecord, error: undefined });
			characterInteractionActionStore.set({ status: 'success', data: actionRecord, error: undefined });
			characterBodyStore.set({ status: 'success', data: bodyRecord, error: undefined });
			characterBodyStateStore.set({ status: 'success', data: bodyStateRecord, error: undefined });
			needStore.set({ status: 'success', data: needRecord });
			needFulfillmentStore.set({ status: 'success', data: fulfillmentRecord });
			characterNeedStore.set({ status: 'success', data: characterNeedRecord });
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			characterStore.set({ status: 'error', data: {}, error: err });
			characterFaceStateStore.set({ status: 'error', data: {}, error: err });
			characterInteractionStore.set({ status: 'error', data: {}, error: err });
			characterInteractionActionStore.set({ status: 'error', data: {}, error: err });
			characterBodyStore.set({ status: 'error', data: {}, error: err });
			characterBodyStateStore.set({ status: 'error', data: {}, error: err });
			needStore.set({ status: 'error', data: {}, error: err });
			needFulfillmentStore.set({ status: 'error', data: {}, error: err });
			characterNeedStore.set({ status: 'error', data: {}, error: err });
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

	function openNeedDialog(state: NonNullable<NeedDialogState>) {
		needDialogStore.set(state);
	}

	function closeNeedDialog() {
		needDialogStore.set(undefined);
	}

	// Getter functions
	function getCharacter(id: CharacterId): Character | undefined {
		return get(characterStore).data[id];
	}

	function getCharacterFaceStates(characterId: CharacterId): CharacterFaceState[] | undefined {
		return get(characterFaceStateStore).data[characterId];
	}

	function getCharacterInteraction(id: CharacterInteractionId): CharacterInteraction | undefined {
		return get(characterInteractionStore).data[id];
	}

	function getCharacterInteractionActions(
		characterInteractionId: CharacterInteractionId
	): CharacterInteractionAction[] | undefined {
		return get(characterInteractionActionStore).data[characterInteractionId];
	}

	function getCharacterBody(id: CharacterBodyId): CharacterBody | undefined {
		return get(characterBodyStore).data[id];
	}

	function getCharacterBodyStates(bodyId: CharacterBodyId): CharacterBodyState[] | undefined {
		return get(characterBodyStateStore).data[bodyId];
	}

	function getNeed(id: NeedId): Need | undefined {
		return get(needStore).data[id];
	}

	function getNeedFulfillment(id: NeedFulfillmentId): NeedFulfillment | undefined {
		return get(needFulfillmentStore).data[id];
	}

	function getCharacterNeed(id: CharacterNeedId): CharacterNeed | undefined {
		return get(characterNeedStore).data[id];
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

		async createCharacter(scenarioId: ScenarioId, character: Omit<CharacterInsert, 'scenario_id'>) {
			const { data, error } = await supabase
				.from('characters')
				.insert({
					...character,
					scenario_id: scenarioId,
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

		async createCharacterInteraction(scenarioId: ScenarioId, interaction: Omit<CharacterInteractionInsert, 'scenario_id'>) {
			const { data, error } = await supabase
				.from('character_interactions')
				.insert({
					...interaction,
					scenario_id: scenarioId,
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
			scenarioId: ScenarioId,
			characterInteractionId: CharacterInteractionId,
			action: Omit<
				CharacterInteractionActionInsert,
				'scenario_id' | 'character_id' | 'target_character_id' | 'character_interaction_id'
			>
		) {
			// Get character_id and target_character_id from interaction (nullable for default interactions)
			const characterInteractionStoreValue = get(characterInteractionStore);
			const interaction = characterInteractionStoreValue.data[characterInteractionId];
			const characterId = interaction?.character_id || null;
			const targetCharacterId = interaction?.target_character_id || null;

			const { data, error } = await supabase
				.from('character_interaction_actions')
				.insert({
					...action,
					scenario_id: scenarioId,
					character_id: characterId,
					target_character_id: targetCharacterId,
					character_interaction_id: characterInteractionId,
				})
				.select()
				.single<CharacterInteractionAction>();

			if (error) throw error;

			characterInteractionActionStore.update((s) =>
				produce(s, (draft) => {
					if (draft.data[characterInteractionId]) {
						draft.data[characterInteractionId].push(data);
					} else {
						draft.data[characterInteractionId] = [data];
					}
				})
			);

			return data;
		},

		async updateCharacterInteractionAction(
			actionId: CharacterInteractionActionId,
			characterInteractionId: CharacterInteractionId,
			updates: CharacterInteractionActionUpdate
		) {
			const { error } = await supabase
				.from('character_interaction_actions')
				.update(updates)
				.eq('id', actionId);

			if (error) throw error;

			characterInteractionActionStore.update((s) =>
				produce(s, (draft) => {
					const actions = draft.data[characterInteractionId];
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
			characterInteractionId: CharacterInteractionId
		) {
			const { error } = await supabase
				.from('character_interaction_actions')
				.delete()
				.eq('id', actionId);

			if (error) throw error;

			characterInteractionActionStore.update((s) =>
				produce(s, (draft) => {
					const actions = draft.data[characterInteractionId];
					if (actions) {
						draft.data[characterInteractionId] = actions.filter((a) => a.id !== actionId);
					}
				})
			);
		},

		async createCharacterBody(scenarioId: ScenarioId, body: Omit<CharacterBodyInsert, 'scenario_id'>) {
			const { data, error } = await supabase
				.from('character_bodies')
				.insert({
					...body,
					scenario_id: scenarioId,
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

		// Need CRUD
		async createNeed(scenarioId: ScenarioId, need: Omit<NeedInsert, 'scenario_id'>) {
			const { data, error } = await supabase
				.from('needs')
				.insert({ ...need, scenario_id: scenarioId })
				.select()
				.single<Need>();

			if (error) throw error;

			needStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as NeedId] = data;
				})
			);

			return data;
		},

		async updateNeed(id: NeedId, need: NeedUpdate) {
			const { error } = await supabase.from('needs').update(need).eq('id', id);

			if (error) throw error;

			needStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], need);
					}
				})
			);
		},

		async removeNeed(id: NeedId) {
			const { error } = await supabase.from('needs').delete().eq('id', id);

			if (error) throw error;

			needStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);
		},

		// NeedFulfillment CRUD
		async createNeedFulfillment(
			scenarioId: ScenarioId,
			fulfillment: Omit<NeedFulfillmentInsert, 'scenario_id'>
		) {
			const { data, error } = await supabase
				.from('need_fulfillments')
				.insert({ ...fulfillment, scenario_id: scenarioId })
				.select()
				.single<NeedFulfillment>();

			if (error) throw error;

			needFulfillmentStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as NeedFulfillmentId] = data;
				})
			);

			return data;
		},

		async updateNeedFulfillment(id: NeedFulfillmentId, fulfillment: NeedFulfillmentUpdate) {
			const { error } = await supabase.from('need_fulfillments').update(fulfillment).eq('id', id);

			if (error) throw error;

			needFulfillmentStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], fulfillment);
					}
				})
			);
		},

		async removeNeedFulfillment(id: NeedFulfillmentId) {
			const { error } = await supabase.from('need_fulfillments').delete().eq('id', id);

			if (error) throw error;

			needFulfillmentStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);
		},

		// CharacterNeed CRUD
		async createCharacterNeed(
			scenarioId: ScenarioId,
			characterNeed: Omit<CharacterNeedInsert, 'scenario_id'>
		) {
			const { data, error } = await supabase
				.from('character_needs')
				.insert({ ...characterNeed, scenario_id: scenarioId })
				.select()
				.single<CharacterNeed>();

			if (error) throw error;

			characterNeedStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as CharacterNeedId] = data;
				})
			);

			return data;
		},

		async updateCharacterNeed(id: CharacterNeedId, characterNeed: CharacterNeedUpdate) {
			const { error } = await supabase.from('character_needs').update(characterNeed).eq('id', id);

			if (error) throw error;

			characterNeedStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], characterNeed);
					}
				})
			);
		},

		async removeCharacterNeed(id: CharacterNeedId) {
			const { error } = await supabase.from('character_needs').delete().eq('id', id);

			if (error) throw error;

			characterNeedStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
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
		needStore: needStore as Readable<RecordFetchState<NeedId, Need>>,
		needFulfillmentStore: needFulfillmentStore as Readable<
			RecordFetchState<NeedFulfillmentId, NeedFulfillment>
		>,
		characterNeedStore: characterNeedStore as Readable<
			RecordFetchState<CharacterNeedId, CharacterNeed>
		>,
		needDialogStore: needDialogStore as Readable<NeedDialogState>,
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
		openNeedDialog,
		closeNeedDialog,
		getCharacter,
		getCharacterFaceStates,
		getCharacterInteraction,
		getCharacterInteractionActions,
		getCharacterBody,
		getCharacterBodyStates,
		getNeed,
		getNeedFulfillment,
		getCharacterNeed,
		admin,
	};
}

export function useCharacter() {
	if (!instance) {
		instance = createCharacterStore();
	}
	return instance;
}
