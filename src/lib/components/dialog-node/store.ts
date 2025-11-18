import { get, writable } from 'svelte/store';
import type { DialogNode } from '.';

export const dialogNode = writable<DialogNode | undefined>();
export const dialogNodes = writable<Record<string, DialogNode>>({});

export function close() {
	dialogNode.set(undefined);
}

export function open(dialogNodeId: string) {
	const $dialogNodes = get(dialogNodes);
	const $dialogNode = $dialogNodes[dialogNodeId];

	if ($dialogNode === undefined) {
		throw new Error(`Dialog node with ID "${dialogNodeId}" not found.`);
	}

	dialogNode.set($dialogNode);
}
