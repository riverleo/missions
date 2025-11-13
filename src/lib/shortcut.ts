import type { ShortcutEventDetail } from '@svelte-put/shortcut';

export function onshortcut(event: CustomEvent<ShortcutEventDetail>) {
	console.log('Sidebar shortcut triggered', event);
}
