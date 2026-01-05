import type { WorldContext } from '$lib/components/app/world/context';
import { createContext } from 'svelte';

export { useWorld } from './use-world';
export { useWorldTest, TEST_PLAYER_ID, TEST_SCENARIO_ID, TEST_WORLD_ID } from './use-world-test';

// WorldContext (Svelte context)
export const [useWorldContext, setWorldContext] = createContext<WorldContext>();
