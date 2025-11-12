// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

// Storybook type declarations
declare module '@storybook/addon-svelte-csf' {
	export function defineMeta(config: any): any;
}

export {};
