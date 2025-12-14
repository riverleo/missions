import { writable, type Readable, type Writable } from 'svelte/store';
import type {
	FetchState,
	Narrative,
	NarrativeDiceRoll,
	NarrativeNode,
	NarrativeNodeChoice,
	PlayerRolledDice,
	Supabase,
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
import { open, roll, next, done, highlight, select } from './play';

// Types
type DialogState =
	| { type: 'create' }
	| { type: 'update' | 'delete'; narrativeId: string }
	| undefined;

interface AdminStoreState {
	dialog: DialogState;
}

export interface PlayStoreState {
	narrativeId?: string;
	narrativeNodeId?: string;
	narrativeDiceRollId?: string;
	selectedNarrativeNodeChoiceId?: string;
	playerRolledDice?: PlayerRolledDice;
}

export type NarrativeStore = Writable<FetchState<Record<string, Narrative>>>;
export type NarrativeNodeStore = Writable<FetchState<Record<string, NarrativeNode>>>;
export type NarrativeDiceRollStore = Writable<FetchState<Record<string, NarrativeDiceRoll>>>;
export type NarrativeNodeChoiceStore = Writable<FetchState<Record<string, NarrativeNodeChoice>>>;
export type PlayStore = Writable<PlayStoreState>;

let instance: ReturnType<typeof createNarrativeStore> | undefined = undefined;

function createEmptyFetchState<T>(): FetchState<Record<string, T>> {
	return {
		status: 'idle',
		data: undefined,
		error: undefined,
	};
}

function createNarrativeStore() {
	const { supabase } = useServerPayload();

	const narrativeStore = writable<FetchState<Record<string, Narrative>>>(createEmptyFetchState());
	const narrativeNodeStore = writable<FetchState<Record<string, NarrativeNode>>>(createEmptyFetchState());
	const narrativeDiceRollStore = writable<FetchState<Record<string, NarrativeDiceRoll>>>(createEmptyFetchState());
	const narrativeNodeChoiceStore = writable<FetchState<Record<string, NarrativeNodeChoice>>>(createEmptyFetchState());

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
		narrativeStore: narrativeStore as Readable<FetchState<Record<string, Narrative>>>,
		narrativeNodeStore: narrativeNodeStore as Readable<FetchState<Record<string, NarrativeNode>>>,
		narrativeDiceRollStore: narrativeDiceRollStore as Readable<FetchState<Record<string, NarrativeDiceRoll>>>,
		narrativeNodeChoiceStore: narrativeNodeChoiceStore as Readable<FetchState<Record<string, NarrativeNodeChoice>>>,
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
			open: open(narrativeStore, narrativeNodeStore, narrativeDiceRollStore, playStore),
			roll: roll(narrativeDiceRollStore, playStore),
			next: next(narrativeNodeStore, narrativeNodeChoiceStore, narrativeDiceRollStore, playStore),
			done: done(playStore),
			highlight: highlight(playStore),
			select: select(narrativeNodeStore, narrativeNodeChoiceStore, narrativeDiceRollStore, playStore),
		},
	};
}

export function useNarrative() {
	if (!instance) {
		instance = createNarrativeStore();
	}
	return instance;
}
