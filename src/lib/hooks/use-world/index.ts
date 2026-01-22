import type { WorldContext } from '$lib/components/app/world/context';
import { createContext } from 'svelte';

export { useWorld } from './use-world';
export { useWorldTest } from './use-world-test';

// WorldContext (Svelte context)
export const [useWorldContext, setWorldContext] = createContext<WorldContext>();
