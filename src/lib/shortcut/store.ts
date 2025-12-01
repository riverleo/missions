import { writable, get } from 'svelte/store';

export type LayerId = 'narrative' | 'dice-roll' | 'quest';

export interface LayerConfig {
	onkeyup?: (event: KeyboardEvent) => void;
	onkeydown?: (event: KeyboardEvent) => void;
}

// 현재 활성화된 레이어
export const currentLayerId = writable<LayerId | undefined>(undefined);

// 각 레이어별 설정
export const layers = writable<Record<LayerId, LayerConfig>>({
	narrative: {},
	'dice-roll': {},
	quest: {},
});

// 레이어 이벤트 핸들러 등록
export function bindLayerEvent({ id, onkeyup, onkeydown }: { id: LayerId } & LayerConfig) {
	layers.update((layer) => ({
		...layer,
		[id]: { onkeyup, onkeydown },
	}));
}

// 레이어 활성화
export function activateLayer(id: LayerId) {
	currentLayerId.set(id);
}

// 레이어 비활성화
export function deactivateLayer(id: LayerId) {
	if (get(currentLayerId) !== id) return;

	currentLayerId.set(undefined);
}

// 단축키 취소 상태
export const isShortcutEscaped = writable<boolean>(false);
