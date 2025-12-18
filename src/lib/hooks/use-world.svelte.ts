import { createContext } from 'svelte';

interface WorldContext {
	readonly width: number;
	readonly height: number;
}

export const [useWorld, setWorldContext] = createContext<WorldContext>();
