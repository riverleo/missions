import { createContext } from 'svelte';
import type { Narrative } from '$lib/components/app/narrative/store';

interface NarrativeEditorContext {
	narratives: Record<string, Narrative>;
	focusedNarrativeId: string | undefined;
	createNarrative: () => string;
}

export const [getContext, setContext] = createContext<NarrativeEditorContext>();
