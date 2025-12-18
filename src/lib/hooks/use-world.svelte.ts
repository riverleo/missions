import { createContext } from 'svelte';
import type { WorldContext } from '$lib/components/app/world/world-context.svelte';

export const [useWorld, setWorldContext] = createContext<WorldContext>();
