import { writable, get } from 'svelte/store';

export type LayerId = 'dialog-node' | 'dice-roll' | 'quest';

export interface LayerConfig {
	onkeyup?: (event: KeyboardEvent) => void;
	onkeydown?: (event: KeyboardEvent) => void;
}

// 현재 활성화된 레이어
export const current = writable<LayerId | undefined>(undefined);

// 각 레이어별 설정
export const layers = writable<Record<LayerId, LayerConfig>>({
	'dialog-node': {},
	'dice-roll': {},
	quest: {},
});

// 레이어 이벤트 핸들러 등록
export function bind({ id, onkeyup, onkeydown }: { id: LayerId } & LayerConfig) {
	layers.update((layer) => ({
		...layer,
		[id]: { onkeyup, onkeydown },
	}));
}

// 레이어 활성화
export function activate(id: LayerId) {
	current.set(id);
}

// 레이어 비활성화
export function deactivate(id: LayerId) {
	if (get(current) !== id) return;

	current.set(undefined);
}
