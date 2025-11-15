import { toggleOpen } from '$lib/components/quest/store';

export class KeyBinding {
	public code: string;
	public action: () => void;
	public meta?: boolean;
	public ctrl?: boolean;
	public shift?: boolean;
	public alt?: boolean;

	constructor(config: {
		code: string;
		action: () => void;
		meta?: boolean;
		ctrl?: boolean;
		shift?: boolean;
		alt?: boolean;
	}) {
		this.code = config.code;
		this.action = config.action;
		this.meta = config.meta;
		this.ctrl = config.ctrl;
		this.shift = config.shift;
		this.alt = config.alt;
	}

	match(event: KeyboardEvent): boolean {
		return (
			this.code === event.code &&
			(this.meta ?? false) === event.metaKey &&
			(this.ctrl ?? false) === event.ctrlKey &&
			(this.shift ?? false) === event.shiftKey &&
			(this.alt ?? false) === event.altKey
		);
	}
}

export type KeyBindingId = 'quest-toggle';

type Keymap = Record<KeyBindingId, KeyBinding>;

/**
 * 글로벌 키보드 단축키 맵
 */
export const keymap: Keymap = {
	'quest-toggle': new KeyBinding({ code: 'KeyQ', action: toggleOpen }),
};
