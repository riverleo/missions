import { createContext } from 'svelte';
import type { ServerPayload } from '$lib/types';

export const [useServerPayload, setServerPayloadContext] = createContext<ServerPayload>();
