import { writable, type Readable, type Writable } from 'svelte/store';
import type {
	FetchState,
	Narrative,
	NarrativeDiceRoll,
	NarrativeNode,
	NarrativeNodeChoice,
	PlayerRolledDice,
} from '$lib/types';
import { useServerPayload } from '../use-server-payload.svelte';
import { fetchNarratives, createNarrative, updateNarrative, removeNarrative } from './narrative';
import { createNarrativeNode, updateNarrativeNode, removeNarrativeNode } from './narrative-node';
import {
	createNarrativeNodeChoice,
	updateNarrativeNodeChoice,
	removeNarrativeNodeChoice,
} from './narrative-node-choice';
import {
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
	narrative?: Narrative;
	narrativeNode?: NarrativeNode;
	narrativeDiceRoll?: NarrativeDiceRoll;
	selectedNarrativeNodeChoice?: NarrativeNodeChoice;
	playerRolledDice?: PlayerRolledDice;
}

export type NarrativeStore = Writable<FetchState<Narrative[]>>;
export type PlayStore = Writable<PlayStoreState>;

let instance: ReturnType<typeof createNarrativeStore> | undefined = undefined;

function createNarrativeStore() {
	const { supabase } = useServerPayload();

	const store = writable<FetchState<Narrative[]>>({
		status: 'idle',
		data: undefined,
		error: undefined,
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

	fetchNarratives(supabase, store);

	return {
		store: store as Readable<FetchState<Narrative[]>>,
		admin: {
			store: adminStore as Readable<AdminStoreState>,
			openDialog,
			closeDialog,
			create: createNarrative(supabase, store),
			update: updateNarrative(supabase, store),
			remove: removeNarrative(supabase, store),
			createNode: createNarrativeNode(supabase, store),
			updateNode: updateNarrativeNode(supabase, store),
			removeNode: removeNarrativeNode(supabase, store),
			createChoice: createNarrativeNodeChoice(supabase, store),
			updateChoice: updateNarrativeNodeChoice(supabase, store),
			removeChoice: removeNarrativeNodeChoice(supabase, store),
			createNarrativeDiceRoll: createNarrativeDiceRoll(supabase, store),
			updateNarrativeDiceRoll: updateNarrativeDiceRoll(supabase, store),
			removeNarrativeDiceRoll: removeNarrativeDiceRoll(supabase, store),
		},
		play: {
			store: playStore as Readable<PlayStoreState>,
			open: open(store, playStore),
			roll: roll(store, playStore),
			next: next(store, playStore),
			done: done(playStore),
			highlight: highlight(playStore),
			select: select(store, playStore),
		},
	};
}

export function useNarrative() {
	if (!instance) {
		instance = createNarrativeStore();
	}
	return instance;
}
