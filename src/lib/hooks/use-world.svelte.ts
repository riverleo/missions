import { createContext } from 'svelte';
import type { WorldContext } from '$lib/components/app/world/context';

export const [useWorld, setWorldContext] = createContext<WorldContext>();
