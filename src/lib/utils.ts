import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { tv } from 'tailwind-variants';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export { tv };

// Type utilities for shadcn-svelte components
export type WithElementRef<T, E = HTMLElement> = T & {
	ref?: E | null;
};

export type WithoutChild<T> = Omit<T, 'child'>;

export type WithoutChildren<T> = Omit<T, 'children'>;

export type WithoutChildrenOrChild<T> = WithoutChild<T> & WithoutChildren<T>;
