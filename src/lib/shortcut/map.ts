import { toggleOpen } from '$lib/components/app/quest/store';

export class Shortcut {
	public code: string;
	public action: () => void;
	public meta?: boolean;
	public ctrl?: boolean;
	public shift?: boolean;
	public alt?: boolean;
	public metaOrCtrl?: boolean;

	constructor(config: {
		code: string;
		action: () => void;
		meta?: boolean;
		ctrl?: boolean;
		shift?: boolean;
		alt?: boolean;
		metaOrCtrl?: boolean;
	}) {
		this.code = config.code;
		this.action = config.action;
		this.meta = config.meta;
		this.ctrl = config.ctrl;
		this.shift = config.shift;
		this.alt = config.alt;
		this.metaOrCtrl = config.metaOrCtrl;
	}

	match(event: KeyboardEvent): boolean {
		if (this.code !== event.code) return false;

		// metaOrCtrl이 설정된 경우 meta 또는 ctrl 중 하나만 있으면 됨
		if (this.metaOrCtrl) {
			if (!event.metaKey && !event.ctrlKey) return false;
		} else {
			if ((this.meta ?? false) !== event.metaKey) return false;
			if ((this.ctrl ?? false) !== event.ctrlKey) return false;
		}

		return (this.shift ?? false) === event.shiftKey && (this.alt ?? false) === event.altKey;
	}
}

export type ShortcutId = 'new-quest-toggle';

/**
 * 글로벌 키보드 단축키 맵
 */
export default {
	'new-quest-toggle': new Shortcut({ code: 'KeyQ', action: toggleOpen }),
} as Record<ShortcutId, Shortcut>;
