import { writable, type Readable, get } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	FetchStatus,
	Scenario,
	ScenarioInsert,
	ScenarioUpdate,
	ScenarioId,
	ScenarioSnapshot,
	ScenarioSnapshotId,
} from '$lib/types';
import { useApp } from './use-app.svelte';
import { usePlayer } from './use-player';
import { useQuest } from './use-quest';
import { useChapter } from './use-chapter';
import { useTerrain } from './use-terrain';
import { useCharacter } from './use-character';
import { useBuilding } from './use-building';
import { useBehavior } from './use-behavior/index';
import { useFulfillment } from './use-fulfillment';
import { useItem } from './use-item';
import { useWorld } from './use-world';
import { useNarrative } from './use-narrative';
import { useInteraction } from './use-interaction';

type ScenarioStoreState = RecordFetchState<ScenarioId, Scenario>;
type SnapshotStoreState = RecordFetchState<ScenarioSnapshotId, ScenarioSnapshot>;

type ScenarioDialogState =
	| { type: 'create' }
	| { type: 'update'; scenarioId: ScenarioId }
	| { type: 'delete'; scenarioId: ScenarioId }
	| { type: 'publish'; scenarioId: ScenarioId }
	| undefined;

type SnapshotDialogState = { type: 'create'; scenarioId: ScenarioId } | undefined;

let instance: ReturnType<typeof createScenarioStore> | null = null;

function createScenarioStore() {
	const { supabase } = useApp();

	const scenarioStore = writable<ScenarioStoreState>({ status: 'idle', data: {} });
	const snapshotStore = writable<SnapshotStoreState>({ status: 'idle', data: {} });
	const fetchAllStatus = writable<FetchStatus>('idle');

	const scenarioDialogStore = writable<ScenarioDialogState>(undefined);
	const snapshotDialogStore = writable<SnapshotDialogState>(undefined);

	function openScenarioDialog(state: NonNullable<ScenarioDialogState>) {
		scenarioDialogStore.set(state);
	}

	function closeScenarioDialog() {
		scenarioDialogStore.set(undefined);
	}

	function openScenarioSnapshotDialog(state: NonNullable<SnapshotDialogState>) {
		snapshotDialogStore.set(state);
	}

	function closeScenarioSnapshotDialog() {
		snapshotDialogStore.set(undefined);
	}

	async function fetch() {
		scenarioStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase
				.from('scenarios')
				.select('*')
				.order('display_order', { ascending: true });

			if (error) throw error;

			// Convert array to Record
			const record: Record<ScenarioId, Scenario> = {};
			for (const item of data ?? []) {
				record[item.id as ScenarioId] = item as Scenario;
			}

			scenarioStore.update((state) => ({
				...state,
				status: 'success',
				data: record,
				error: undefined,
			}));
		} catch (error) {
			scenarioStore.update((state) => ({
				...state,
				status: 'error',
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
		}
	}

	async function fetchScenarioSnapshots(scenarioId: ScenarioId) {
		snapshotStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase
				.from('scenario_snapshots')
				.select('*')
				.eq('scenario_id', scenarioId)
				.order('created_at', { ascending: false });

			if (error) throw error;

			// Convert array to Record
			const record: Record<ScenarioSnapshotId, ScenarioSnapshot> = {};
			for (const item of data ?? []) {
				record[item.id as ScenarioSnapshotId] = item as ScenarioSnapshot;
			}

			snapshotStore.update((state) => ({
				...state,
				status: 'success',
				data: record,
				error: undefined,
			}));
		} catch (error) {
			snapshotStore.update((state) => ({
				...state,
				status: 'error',
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
		}
	}

	const admin = {
		async fetchAll() {
			fetchAllStatus.set('loading');

			try {
				// Player 먼저 초기화 (다른 훅에서 참조 가능하도록)
				const { fetch: fetchPlayer } = usePlayer();
				await fetchPlayer();

				const { fetch: fetchQuest } = useQuest();
				const { fetch: fetchChapter } = useChapter();
				const {
					fetch: fetchTerrain,
					fetchTiles,
					fetchTileStates,
					fetchTerrainTiles,
				} = useTerrain();
				const { fetch: fetchCharacter } = useCharacter();
				const { fetch: fetchBuilding } = useBuilding();
				const { fetch: fetchBehavior } = useBehavior();
				const { fetch: fetchItem } = useItem();
				const { fetch: fetchInteraction } = useInteraction();
				const { fetch: fetchWorld } = useWorld();

				await Promise.all([
					fetchQuest(),
					fetchChapter(),
					fetchTerrain(),
					fetchTiles(),
					fetchTileStates(),
					fetchTerrainTiles(),
					fetchCharacter(),
					fetchBuilding(),
					fetchBehavior(),
					fetchItem(),
					fetchInteraction(),
					fetchWorld(),
				]);

				fetchAllStatus.set('success');
			} catch (error) {
				fetchAllStatus.set('error');
				throw error;
			}
		},

		async createScenario(input: Omit<ScenarioInsert, 'display_order'>) {
			const { data, error } = await supabase
				.from('scenarios')
				.insert(input)
				.select()
				.single<Scenario>();

			if (error) throw error;

			scenarioStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as ScenarioId] = data;
				})
			);

			return data;
		},

		async updateScenario(scenarioId: ScenarioId, input: ScenarioUpdate) {
			const { error } = await supabase.from('scenarios').update(input).eq('id', scenarioId);

			if (error) throw error;

			scenarioStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[scenarioId]) {
						Object.assign(draft.data[scenarioId], input);
					}
				})
			);
		},

		async removeScenario(scenarioId: ScenarioId) {
			const { error } = await supabase.from('scenarios').delete().eq('id', scenarioId);

			if (error) throw error;

			scenarioStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[scenarioId];
					}
				})
			);
		},

		async publishScenario(scenarioId: ScenarioId) {
			const { error } = await supabase
				.from('scenarios')
				.update({ status: 'published' })
				.eq('id', scenarioId);

			if (error) throw error;

			scenarioStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[scenarioId]) {
						draft.data[scenarioId].status = 'published';
					}
				})
			);
		},

		async unpublishScenario(scenarioId: ScenarioId) {
			const { error } = await supabase
				.from('scenarios')
				.update({ status: 'draft' })
				.eq('id', scenarioId);

			if (error) throw error;

			scenarioStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[scenarioId]) {
						draft.data[scenarioId].status = 'draft';
					}
				})
			);
		},

		async createScenarioSnapshot(scenarioId: ScenarioId, name: string, description: string = '') {
			// Collect all master data for the scenario
			const { terrainStore, tileStore, tileStateStore, terrainTileStore } = useTerrain();
			const {
				getAllCharacterBodies,
				getAllCharacterNeeds,
				getAllCharacters,
				getAllNeeds,
				getOrUndefinedCharacterBodyStates,
				getOrUndefinedCharacterFaceStates,
			} = useCharacter();
			const {
				getAllBuildingConditions,
				getAllBuildings,
				getAllConditionEffects,
				getAllConditions,
				getOrUndefinedBuildingStates,
			} = useBuilding();
			const { getAllNeedFulfillments, getAllConditionFulfillments } = useFulfillment();
			const { getAllItems, getOrUndefinedItemStates } = useItem();
			const {
				getAllCharacterInteractions,
				getCharacterInteractionActions,
				getAllBuildingInteractions,
				getBuildingInteractionActions,
				getAllItemInteractions,
				getItemInteractionActions,
			} = useInteraction();
			const {
				conditionBehaviorActionStore,
				getAllBehaviorPriorities,
				getAllConditionBehaviors,
				getAllNeedBehaviorActions,
				getAllNeedBehaviors,
			} = useBehavior();
			const { questStore, questBranchStore } = useQuest();
			const { chapterStore } = useChapter();
			const {
				narrativeStore,
				narrativeNodeStore,
				narrativeNodeChoiceStore,
				narrativeDiceRollStore,
			} = useNarrative();

			// Get all data from stores
			// Terrain related
			const terrains = Object.values(get(terrainStore).data).filter(
				(t) => t.scenario_id === scenarioId
			);
			const tiles = Object.values(get(tileStore).data).filter((t) => t.scenario_id === scenarioId);
			const tileStates = Object.values(get(tileStateStore).data);
			const terrainTiles = Object.values(get(terrainTileStore).data).filter((tt) =>
				terrains.some((t) => t.id === tt.terrain_id)
			);

			// Character related
			const characters = getAllCharacters().filter((c) => c.scenario_id === scenarioId);
			const characterNeeds = getAllCharacterNeeds().filter((cn) =>
				characters.some((c) => c.id === cn.character_id)
			);
			const characterBodies = getAllCharacterBodies().filter((cb) =>
				characters.some((c) => c.character_body_id === cb.id)
			);
			const characterBodyStates = characterBodies.flatMap((cb) =>
				Object.values(getOrUndefinedCharacterBodyStates(cb.id) ?? [])
			);
			const characterFaceStates = characters.flatMap((c) =>
				Object.values(getOrUndefinedCharacterFaceStates(c.id) ?? [])
			);
			const characterInteractions = getAllCharacterInteractions().filter(
				(ci) => ci.scenario_id === scenarioId
			);
			const characterInteractionActions = characterInteractions.flatMap((ci) =>
				Object.values(getCharacterInteractionActions(ci.id) ?? [])
			);

			// Building related
			const buildings = getAllBuildings().filter((b) => b.scenario_id === scenarioId);
			const buildingConditions = getAllBuildingConditions().filter((bc) =>
				buildings.some((b) => b.id === bc.building_id)
			);
			const buildingStates = buildings.flatMap((b) => Object.values(getOrUndefinedBuildingStates(b.id) ?? []));
			const buildingInteractions = getAllBuildingInteractions().filter(
				(bi) => bi.scenario_id === scenarioId
			);
			const buildingInteractionActions = buildingInteractions.flatMap((bi) =>
				Object.values(getBuildingInteractionActions(bi.id) ?? [])
			);

			// Item related
			const items = getAllItems().filter((i) => i.scenario_id === scenarioId);
			const itemStates = items.flatMap((i) => Object.values(getOrUndefinedItemStates(i.id) ?? []));
			const itemInteractions = getAllItemInteractions().filter(
				(ii) => ii.scenario_id === scenarioId
			);
			const itemInteractionActions = itemInteractions.flatMap((ii) =>
				Object.values(getItemInteractionActions(ii.id) ?? [])
			);

			// Need related
			const needs = getAllNeeds().filter((n) => n.scenario_id === scenarioId);
			const needFulfillments = getAllNeedFulfillments().filter((nf) =>
				needs.some((n) => n.id === nf.need_id)
			);
			const needBehaviors = getAllNeedBehaviors().filter((nb) =>
				needs.some((n) => n.id === nb.need_id)
			);
			const needBehaviorActions = getAllNeedBehaviorActions().filter((nba) =>
				needBehaviors.some((nb) => nb.id === nba.need_behavior_id)
			);

			// Condition related
			const conditions = getAllConditions().filter((c) => c.scenario_id === scenarioId);
			const conditionFulfillments = getAllConditionFulfillments().filter((cf) =>
				conditions.some((c) => c.id === cf.condition_id)
			);
			const conditionEffects = getAllConditionEffects().filter((ce) =>
				conditions.some((c) => c.id === ce.condition_id)
			);
			const conditionBehaviors = getAllConditionBehaviors().filter(
				(cb) => cb.scenario_id === scenarioId
			);
			const conditionBehaviorActions = Object.values(get(conditionBehaviorActionStore).data).filter(
				(cba) => conditionBehaviors.some((cb) => cb.id === cba.condition_behavior_id)
			);

			// Behavior priorities
			const behaviorPriorities = getAllBehaviorPriorities().filter(
				(bp) => bp.scenario_id === scenarioId
			);

			// Quest related
			const quests = Object.values(get(questStore).data).filter(
				(q) => q.scenario_id === scenarioId
			);
			const questBranches = Object.values(get(questBranchStore).data).filter((qb) =>
				quests.some((q) => q.id === qb.quest_id)
			);

			// Chapter
			const chapters = Object.values(get(chapterStore).data).filter(
				(c) => c.scenario_id === scenarioId
			);

			// Narrative related
			const narratives = Object.values(get(narrativeStore).data).filter(
				(n) => n.scenario_id === scenarioId
			);
			const narrativeNodes = Object.values(get(narrativeNodeStore).data).filter((nn) =>
				narratives.some((n) => n.id === nn.narrative_id)
			);
			const narrativeNodeChoices = Object.values(get(narrativeNodeChoiceStore).data).filter((nnc) =>
				narrativeNodes.some((nn) => nn.id === nnc.narrative_node_id)
			);
			const narrativeDiceRolls = Object.values(get(narrativeDiceRollStore).data).filter((ndr) =>
				narratives.some((n) => n.id === ndr.narrative_id)
			);

			// Create snapshot data
			const snapshotData = {
				// Terrain
				terrains,
				tiles,
				tileStates,
				terrainTiles,
				// Character
				characters,
				characterNeeds,
				characterBodies,
				characterBodyStates,
				characterFaceStates,
				characterInteractions,
				characterInteractionActions,
				// Building
				buildings,
				buildingConditions,
				buildingStates,
				buildingInteractions,
				buildingInteractionActions,
				// Item
				items,
				itemStates,
				itemInteractions,
				itemInteractionActions,
				// Need
				needs,
				needFulfillments,
				needBehaviors,
				needBehaviorActions,
				// Condition
				conditions,
				conditionFulfillments,
				conditionEffects,
				conditionBehaviors,
				conditionBehaviorActions,
				// Behavior
				behaviorPriorities,
				// Quest
				quests,
				questBranches,
				// Chapter
				chapters,
				// Narrative
				narratives,
				narrativeNodes,
				narrativeNodeChoices,
				narrativeDiceRolls,
			};

			// Insert snapshot
			const { data, error } = await supabase
				.from('scenario_snapshots')
				.insert({
					scenario_id: scenarioId,
					name,
					description,
					data: snapshotData,
				})
				.select()
				.single<ScenarioSnapshot>();

			if (error) throw error;

			snapshotStore.update((state) => ({
				...state,
				data: {
					...state.data,
					[data.id]: data,
				},
			}));

			return data;
		},
	};

	return {
		scenarioStore: scenarioStore as Readable<ScenarioStoreState>,
		scenarioSnapshotStore: snapshotStore as Readable<SnapshotStoreState>,
		scenarioDialogStore: scenarioDialogStore as Readable<ScenarioDialogState>,
		scenarioSnapshotDialogStore: snapshotDialogStore as Readable<SnapshotDialogState>,
		fetchAllStatus: fetchAllStatus as Readable<FetchStatus>,
		fetch,
		fetchScenarioSnapshots,
		openScenarioDialog,
		closeScenarioDialog,
		openScenarioSnapshotDialog,
		closeScenarioSnapshotDialog,
		admin,
	};
}

export function useScenario() {
	if (!instance) {
		instance = createScenarioStore();
	}
	return instance;
}
