// Type utilities for shadcn-svelte components
export type WithElementRef<T, E = HTMLElement> = T & {
	ref?: E | null;
};

export type WithoutChild<T> = Omit<T, 'child'>;

export type WithoutChildren<T> = Omit<T, 'children'>;

export type WithoutChildrenOrChild<T> = WithoutChild<T> & WithoutChildren<T>;

// Re-export utilities
export { default as cn } from './cn';
export { getAvatarUrl, uploadAvatar } from './storage.svelte';
export { TreeMap, TreeNode, toTreeMap } from './tree';
