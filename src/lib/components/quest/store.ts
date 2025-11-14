import { writable } from 'svelte/store';

export const open = writable(false);

export const toggleOpen = () => open.update((v) => !v);
