import { createContext } from 'svelte';
import type { AppPayload } from '$lib/types';

export const [useApp, setAppContext] = createContext<AppPayload>();
