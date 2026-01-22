import { writable, type Readable } from 'svelte/store';
import type {
	RecordFetchState,
	Narrative,
	NarrativeDiceRoll,
	NarrativeNode,
	NarrativeNodeChoice,
	NarrativeId,
	NarrativeNodeId,
	NarrativeDiceRollId,
	NarrativeNodeChoiceId,
} from '$lib/types';
import type { NarrativeAdminStoreState, DialogState, PlayStoreState } from '$lib/types/hooks';
import { useApp } from '../use-app.svelte';
import { fetchNarratives, createNarrative, updateNarrative, removeNarrative } from './narrative';
import {
	fetchNarrativeNodes,
	createNarrativeNode,
	updateNarrativeNode,
	removeNarrativeNode,
} from './narrative-node';
import {
	fetchNarrativeNodeChoices,
	createNarrativeNodeChoice,
	updateNarrativeNodeChoice,
	removeNarrativeNodeChoice,
} from './narrative-node-choice';
import {
	fetchNarrativeDiceRolls,
	createNarrativeDiceRoll,
	updateNarrativeDiceRoll,
	removeNarrativeDiceRoll,
} from './narrative-dice-roll';
import { run, roll, next, done } from './play';

let instance: ReturnType<typeof createNarrativeStore> | undefined = undefined;

function createNarrativeStore() {
	const { supabase } = useApp();

	const narrativeStore = writable<RecordFetchState<NarrativeId, Narrative>>({
		status: 'idle',
		data: {},
	});
	const narrativeNodeStore = writable<RecordFetchState<NarrativeNodeId, NarrativeNode>>({
		status: 'idle',
		data: {},
	});
	const narrativeDiceRollStore = writable<RecordFetchState<NarrativeDiceRollId, NarrativeDiceRoll>>(
		{
			status: 'idle',
			data: {},
		}
	);
	const narrativeNodeChoiceStore = writable<
		RecordFetchState<NarrativeNodeChoiceId, NarrativeNodeChoice>
	>({
		status: 'idle',
		data: {},
	});

	const adminStore = writable<NarrativeAdminStoreState>({ dialog: undefined });
	const playStore = writable<PlayStoreState>({});

	// Admin dialog functions
	const openDialog = (state: NonNullable<DialogState>) => {
		adminStore.update((s) => ({ ...s, dialog: state }));
	};

	const closeDialog = () => {
		adminStore.update((s) => ({ ...s, dialog: undefined }));
	};

	// Fetch all data
	const fetchAll = async () => {
		await Promise.all([
			fetchNarratives(supabase, narrativeStore),
			fetchNarrativeNodes(supabase, narrativeNodeStore),
			fetchNarrativeDiceRolls(supabase, narrativeDiceRollStore),
			fetchNarrativeNodeChoices(supabase, narrativeNodeChoiceStore),
		]);
	};

	fetchAll();

	return {
		narrativeStore: narrativeStore as Readable<RecordFetchState<NarrativeId, Narrative>>,
		narrativeNodeStore: narrativeNodeStore as Readable<
			RecordFetchState<NarrativeNodeId, NarrativeNode>
		>,
		narrativeDiceRollStore: narrativeDiceRollStore as Readable<
			RecordFetchState<NarrativeDiceRollId, NarrativeDiceRoll>
		>,
		narrativeNodeChoiceStore: narrativeNodeChoiceStore as Readable<
			RecordFetchState<NarrativeNodeChoiceId, NarrativeNodeChoice>
		>,
		admin: {
			store: adminStore as Readable<NarrativeAdminStoreState>,
			openDialog,
			closeDialog,
			create: createNarrative(supabase, narrativeStore),
			update: updateNarrative(supabase, narrativeStore),
			remove: removeNarrative(supabase, narrativeStore),
			createNode: createNarrativeNode(supabase, narrativeNodeStore),
			updateNode: updateNarrativeNode(supabase, narrativeNodeStore),
			removeNode: removeNarrativeNode(supabase, narrativeNodeStore),
			createChoice: createNarrativeNodeChoice(supabase, narrativeNodeChoiceStore),
			updateChoice: updateNarrativeNodeChoice(supabase, narrativeNodeChoiceStore),
			removeChoice: removeNarrativeNodeChoice(supabase, narrativeNodeChoiceStore),
			createNarrativeDiceRoll: createNarrativeDiceRoll(supabase, narrativeDiceRollStore),
			updateNarrativeDiceRoll: updateNarrativeDiceRoll(supabase, narrativeDiceRollStore),
			removeNarrativeDiceRoll: removeNarrativeDiceRoll(supabase, narrativeDiceRollStore),
		},
		play: {
			store: playStore as Readable<PlayStoreState>,
			run: run({
				narrativeStore,
				narrativeNodeStore,
				narrativeNodeChoiceStore,
				narrativeDiceRollStore,
				playStore,
			}),
			roll: roll({
				narrativeStore,
				narrativeNodeStore,
				narrativeNodeChoiceStore,
				narrativeDiceRollStore,
				playStore,
			}),
			next: next({
				narrativeStore,
				narrativeNodeStore,
				narrativeNodeChoiceStore,
				narrativeDiceRollStore,
				playStore,
			}),
			done: done({
				narrativeStore,
				narrativeNodeStore,
				narrativeNodeChoiceStore,
				narrativeDiceRollStore,
				playStore,
			}),
		},
	};
}

export function useNarrative() {
	if (!instance) {
		instance = createNarrativeStore();
	}
	return instance;
}
