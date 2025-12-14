import { writable, type Readable, type Writable } from 'svelte/store';
import type {
	RecordFetchState,
	Narrative,
	NarrativeDiceRoll,
	NarrativeNode,
	NarrativeNodeChoice,
	PlayerRolledDice,
} from '$lib/types';
import { useServerPayload } from '../use-server-payload.svelte';
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
import { run, roll, next, done, select } from './play';

// Types
type DialogState =
	| { type: 'create' }
	| { type: 'update' | 'delete'; narrativeId: string }
	| undefined;

interface AdminStoreState {
	dialog: DialogState;
}

export interface PlayStoreState {
	narrativeNode?: NarrativeNode;
	narrativeDiceRoll?: NarrativeDiceRoll;
	selectedNarrativeNodeChoice?: NarrativeNodeChoice;
	playerRolledDice?: PlayerRolledDice;
}

export type NarrativeStore = Writable<RecordFetchState<Narrative>>;
export type NarrativeNodeStore = Writable<RecordFetchState<NarrativeNode>>;
export type NarrativeDiceRollStore = Writable<RecordFetchState<NarrativeDiceRoll>>;
export type NarrativeNodeChoiceStore = Writable<RecordFetchState<NarrativeNodeChoice>>;
export type PlayStore = Writable<PlayStoreState>;

let instance: ReturnType<typeof createNarrativeStore> | undefined = undefined;

function createNarrativeStore() {
	const { supabase } = useServerPayload();

	const narrativeStore = writable<RecordFetchState<Narrative>>({ status: 'idle', data: {} });
	const narrativeNodeStore = writable<RecordFetchState<NarrativeNode>>({
		status: 'idle',
		data: {},
	});
	const narrativeDiceRollStore = writable<RecordFetchState<NarrativeDiceRoll>>({
		status: 'idle',
		data: {},
	});
	const narrativeNodeChoiceStore = writable<RecordFetchState<NarrativeNodeChoice>>({
		status: 'idle',
		data: {},
	});

	const adminStore = writable<AdminStoreState>({ dialog: undefined });
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
		narrativeStore: narrativeStore as Readable<RecordFetchState<Narrative>>,
		narrativeNodeStore: narrativeNodeStore as Readable<RecordFetchState<NarrativeNode>>,
		narrativeDiceRollStore: narrativeDiceRollStore as Readable<RecordFetchState<NarrativeDiceRoll>>,
		narrativeNodeChoiceStore: narrativeNodeChoiceStore as Readable<
			RecordFetchState<NarrativeNodeChoice>
		>,
		admin: {
			store: adminStore as Readable<AdminStoreState>,
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
			select: select({
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
