import { writable, derived, get, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	Database,
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
	WorldCharacterId,
} from '$lib/types';
import { useApp } from './use-app.svelte';
import { useInteraction } from './use-interaction';
import { useWorld } from './use-world';

type CharacterDialogState =
	| { type: 'create' }
	| { type: 'update'; characterId: CharacterId }
	| { type: 'delete'; characterId: CharacterId }
	| undefined;

type CharacterFaceStateDialogState =
	| { type: 'update'; characterFaceStateId: CharacterFaceStateId }
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
	const interaction = useInteraction();

	const characterStore = writable<RecordFetchState<CharacterId, Character>>({
		status: 'idle',
		data: {},
	});

	// character_id를 키로, 해당 캐릭터의 face states 배열을 값으로
	const characterFaceStateStore = writable<RecordFetchState<CharacterId, CharacterFaceState[]>>({
		status: 'idle',
		data: {},
	});

	const characterDialogStore = writable<CharacterDialogState>(undefined);
	const characterFaceStateDialogStore = writable<CharacterFaceStateDialogState>(undefined);

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

	// Derived stores for computed values
	const allCharactersStore = derived(characterStore, ($store) => Object.values($store.data));

	const allCharacterFaceStatesStore = derived(characterFaceStateStore, ($store) => $store.data);

	const allCharacterBodiesStore = derived(characterBodyStore, ($store) =>
		Object.values($store.data)
	);

	const allCharacterBodyStatesStore = derived(characterBodyStateStore, ($store) => $store.data);

	const allNeedsStore = derived(needStore, ($store) => Object.values($store.data));

	const allNeedFulfillmentsStore = derived(needFulfillmentStore, ($store) =>
		Object.values($store.data)
	);

	const allCharacterNeedsStore = derived(characterNeedStore, ($store) =>
		Object.values($store.data)
	);

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
		characterBodyStore.update((state) => ({ ...state, status: 'loading' }));
		needStore.update((state) => ({ ...state, status: 'loading' }));
		needFulfillmentStore.update((state) => ({ ...state, status: 'loading' }));
		characterNeedStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const [
				charactersResult,
				bodiesResult,
				needsResult,
				fulfillmentsResult,
				characterNeedsResult,
			] = await Promise.all([
				supabase.from('characters').select('*, character_face_states(*)').order('name'),
				supabase.from('character_bodies').select('*, character_body_states(*)').order('name'),
				supabase.from('needs').select('*').order('name'),
				supabase.from('need_fulfillments').select('*'),
				supabase.from('character_needs').select('*'),
			]);

			if (charactersResult.error) throw charactersResult.error;
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
			characterBodyStore.set({ status: 'success', data: bodyRecord, error: undefined });
			characterBodyStateStore.set({ status: 'success', data: bodyStateRecord, error: undefined });
			needStore.set({ status: 'success', data: needRecord });
			needFulfillmentStore.set({ status: 'success', data: fulfillmentRecord });
			characterNeedStore.set({ status: 'success', data: characterNeedRecord });
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			characterStore.set({ status: 'error', data: {}, error: err });
			characterFaceStateStore.set({ status: 'error', data: {}, error: err });
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

	// Getter functions - throw if not found (required data)
	function getCharacter(id: string): Character {
		const data = get(characterStore).data[id as CharacterId];
		if (!data) throw new Error(`Character not found: ${id}`);
		return data;
	}

	function getCharacterBody(id: string): CharacterBody {
		const data = get(characterBodyStore).data[id as CharacterBodyId];
		if (!data) throw new Error(`CharacterBody not found: ${id}`);
		return data;
	}

	// Getter functions - return undefined if not found (optional data)
	function getOrUndefinedCharacter(id: string | null | undefined): Character | undefined {
		if (!id) return undefined;
		return get(characterStore).data[id as CharacterId];
	}

	// World entity helper functions
	function getCharacterByWorldCharacterId(worldCharacterId: WorldCharacterId): Character {
		const { getWorldCharacter } = useWorld();
		const worldCharacter = getWorldCharacter(worldCharacterId);
		if (!worldCharacter) throw new Error(`WorldCharacter not found: ${worldCharacterId}`);
		return getCharacter(worldCharacter.character_id);
	}

	function getOrUndefinedCharacterByWorldCharacterId(worldCharacterId: WorldCharacterId | null | undefined): Character | undefined {
		if (!worldCharacterId) return undefined;
		const { getWorldCharacter } = useWorld();
		const worldCharacter = getWorldCharacter(worldCharacterId);
		if (!worldCharacter) return undefined;
		return getOrUndefinedCharacter(worldCharacter.character_id);
	}

	function getOrUndefinedCharacterFaceStates(characterId: string | null | undefined): CharacterFaceState[] | undefined {
		if (!characterId) return undefined;
		return get(characterFaceStateStore).data[characterId as CharacterId];
	}

	function getOrUndefinedCharacterBody(id: string | null | undefined): CharacterBody | undefined {
		if (!id) return undefined;
		return get(characterBodyStore).data[id as CharacterBodyId];
	}

	function getOrUndefinedCharacterBodyStates(bodyId: string | null | undefined): CharacterBodyState[] | undefined {
		if (!bodyId) return undefined;
		return get(characterBodyStateStore).data[bodyId as CharacterBodyId];
	}

	function getNeed(id: string): Need {
		const data = get(needStore).data[id as NeedId];
		if (!data) throw new Error(`Need not found: ${id}`);
		return data;
	}

	function getOrUndefinedNeed(id: string | null | undefined): Need | undefined {
		if (!id) return undefined;
		return get(needStore).data[id as NeedId];
	}

	function getOrUndefinedNeedFulfillment(id: string | null | undefined): NeedFulfillment | undefined {
		if (!id) return undefined;
		return get(needFulfillmentStore).data[id as NeedFulfillmentId];
	}

	// 오버로드 시그니처
	function getCharacterNeed(id: CharacterNeedId): CharacterNeed;
	function getCharacterNeed(characterId: CharacterId, needId: NeedId): CharacterNeed;
	// 구현
	function getCharacterNeed(
		idOrCharacterId: CharacterNeedId | CharacterId,
		needId?: NeedId
	): CharacterNeed {
		let data: CharacterNeed | undefined;
		if (needId === undefined) {
			// id로 조회
			data = getOrUndefinedCharacterNeed(idOrCharacterId as CharacterNeedId);
		} else {
			// characterId + needId로 조회
			data = getOrUndefinedCharacterNeed(idOrCharacterId as CharacterId, needId);
		}

		if (!data) {
			if (needId === undefined) {
				throw new Error(`CharacterNeed not found: ${idOrCharacterId}`);
			} else {
				throw new Error(
					`CharacterNeed not found for character: ${idOrCharacterId}, need: ${needId}`
				);
			}
		}
		return data;
	}

	// 오버로드 시그니처
	function getOrUndefinedCharacterNeed(
		id: CharacterNeedId | null | undefined
	): CharacterNeed | undefined;
	function getOrUndefinedCharacterNeed(
		characterId: CharacterId | null | undefined,
		needId: NeedId | null | undefined
	): CharacterNeed | undefined;
	// 구현
	function getOrUndefinedCharacterNeed(
		idOrCharacterId: CharacterNeedId | CharacterId | null | undefined,
		needId?: NeedId | null | undefined
	): CharacterNeed | undefined {
		if (!idOrCharacterId) return undefined;
		if (needId === undefined) {
			// id로 조회
			return get(characterNeedStore).data[idOrCharacterId as CharacterNeedId];
		} else {
			// characterId + needId로 조회
			if (!needId) return undefined;
			return Object.values(get(characterNeedStore).data).find(
				(cn) => cn.character_id === idOrCharacterId && cn.need_id === needId
			);
		}
	}

	// GetAll functions
	function getAllCharacters(): Character[] {
		return get(allCharactersStore);
	}

	function getAllCharacterFaceStates(): Record<CharacterId, CharacterFaceState[]> {
		return get(allCharacterFaceStatesStore);
	}

	function getAllCharacterBodies(): CharacterBody[] {
		return get(allCharacterBodiesStore);
	}

	function getAllCharacterBodyStates(): Record<CharacterBodyId, CharacterBodyState[]> {
		return get(allCharacterBodyStatesStore);
	}

	function getAllNeeds(): Need[] {
		return get(allNeedsStore);
	}

	function getAllNeedFulfillments(): NeedFulfillment[] {
		return get(allNeedFulfillmentsStore);
	}

	function getAllCharacterNeeds(): CharacterNeed[] {
		return get(allCharacterNeedsStore);
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

		// Character Interaction CRUD - delegated to useInteraction
		createCharacterInteraction: interaction.admin.createCharacterInteraction,
		updateCharacterInteraction: interaction.admin.updateCharacterInteraction,
		removeCharacterInteraction: interaction.admin.removeCharacterInteraction,
		createCharacterInteractionAction: interaction.admin.createCharacterInteractionAction,
		// Wrapper to maintain old signature (actionId, characterInteractionId, updates) -> (actionId, updates)
		async updateCharacterInteractionAction(
			actionId: CharacterInteractionActionId,
			_characterInteractionId: CharacterInteractionId,
			updates: CharacterInteractionActionUpdate
		) {
			return interaction.admin.updateCharacterInteractionAction(actionId, updates);
		},
		// Wrapper to maintain old signature (actionId, characterInteractionId) -> (actionId)
		async removeCharacterInteractionAction(
			actionId: CharacterInteractionActionId,
			_characterInteractionId: CharacterInteractionId
		) {
			return interaction.admin.removeCharacterInteractionAction(actionId);
		},

		async createCharacterBody(
			scenarioId: ScenarioId,
			body: Omit<CharacterBodyInsert, 'scenario_id'>
		) {
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
		characterBodyStore: characterBodyStore as Readable<
			RecordFetchState<CharacterBodyId, CharacterBody>
		>,
		characterBodyStateStore: characterBodyStateStore as Readable<
			RecordFetchState<CharacterBodyId, CharacterBodyState[]>
		>,
		characterDialogStore: characterDialogStore as Readable<CharacterDialogState>,
		characterFaceStateDialogStore:
			characterFaceStateDialogStore as Readable<CharacterFaceStateDialogState>,
		characterBodyDialogStore: characterBodyDialogStore as Readable<CharacterBodyDialogState>,
		needStore: needStore as Readable<RecordFetchState<NeedId, Need>>,
		needFulfillmentStore: needFulfillmentStore as Readable<
			RecordFetchState<NeedFulfillmentId, NeedFulfillment>
		>,
		characterNeedStore: characterNeedStore as Readable<
			RecordFetchState<CharacterNeedId, CharacterNeed>
		>,
		needDialogStore: needDialogStore as Readable<NeedDialogState>,
		allCharactersStore,
		allCharacterFaceStatesStore,
		allCharacterBodiesStore,
		allCharacterBodyStatesStore,
		allNeedsStore,
		allNeedFulfillmentsStore,
		allCharacterNeedsStore,
		init,
		fetch,
		openCharacterDialog,
		closeCharacterDialog,
		openCharacterFaceStateDialog,
		closeCharacterFaceStateDialog,
		openCharacterBodyDialog,
		closeCharacterBodyDialog,
		openNeedDialog,
		closeNeedDialog,
		getCharacter,
		getOrUndefinedCharacter,
		getCharacterByWorldCharacterId,
		getOrUndefinedCharacterByWorldCharacterId,
		getOrUndefinedCharacterFaceStates,
		getCharacterBody,
		getOrUndefinedCharacterBody,
		getOrUndefinedCharacterBodyStates,
		getNeed,
		getOrUndefinedNeed,
		getOrUndefinedNeedFulfillment,
		getCharacterNeed,
		getOrUndefinedCharacterNeed,
		getAllCharacters,
		getAllCharacterFaceStates,
		getAllCharacterBodies,
		getAllCharacterBodyStates,
		getAllNeeds,
		getAllNeedFulfillments,
		getAllCharacterNeeds,
		admin,
	};
}

export function useCharacter() {
	if (!instance) {
		instance = createCharacterStore();
	}
	return instance;
}
