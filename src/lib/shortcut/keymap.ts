import { toggleOpen } from '$lib/components/quest/store';

type KeyBinding = {
	code: string;
	meta?: boolean;
	ctrl?: boolean;
	shift?: boolean;
	alt?: boolean;
	action: () => void;
};

export type KeyBindingId = 'quest-toggle';

type Keymap = Record<KeyBindingId, KeyBinding>;

/**
 * 글로벌 키보드 단축키 맵
 */
export const keymap: Keymap = {
	'quest-toggle': {
		code: 'KeyQ',
		action: toggleOpen,
	},
};
