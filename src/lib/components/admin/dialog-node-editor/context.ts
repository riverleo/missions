import { createContext } from 'svelte';
import type { DialogNode } from '$lib/components/app/dialog-node/store';

interface DialogNodeEditorContext {
	dialogNodes: Record<string, DialogNode>;
	focusedDialogNodeId: string | undefined;
	createDialogNode: () => string;
}

export const [getContext, setContext] = createContext<DialogNodeEditorContext>();
