import { getContext } from 'svelte';
import type { ServerPayload } from '$lib/types';

export function useServerPayload(): ServerPayload {
	const context = getContext<ServerPayload>('serverPayload');

	if (!context) {
		throw new Error('useServerPayload must be used within ServerPayloadProvider');
	}

	return context;
}
