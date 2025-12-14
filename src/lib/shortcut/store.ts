import { writable, derived } from 'svelte/store';

export type StackId = 'narrative' | 'dice-roll' | 'quest';

export interface StackEvent {
	onkeyup?: (event: KeyboardEvent) => void;
	onkeydown?: (event: KeyboardEvent) => void;
}

// 스택
const stack = writable<StackId[]>([]);

// 현재 활성화된 스택 (스택의 마지막)
export const currentStackId = derived(stack, (s) => s[s.length - 1]);

// 각 스택별 이벤트 핸들러 목록
export const stacks = writable<Record<StackId, StackEvent[]>>({
	narrative: [],
	'dice-roll': [],
	quest: [],
});

// 스택 이벤트 핸들러 등록 (cleanup 함수 반환)
export function bindStackEvent({ id, onkeyup, onkeydown }: { id: StackId } & StackEvent) {
	const event: StackEvent = { onkeyup, onkeydown };

	stacks.update((s) => ({
		...s,
		[id]: [...s[id], event],
	}));

	// cleanup 함수 반환
	return () => {
		stacks.update((s) => ({
			...s,
			[id]: s[id].filter((e) => e !== event),
		}));
	};
}

// 스택 활성화 (이미 있으면 맨 위로 이동, cleanup 함수 반환)
export function activateStack(id: StackId) {
	stack.update((s) => {
		const filtered = s.filter((stackId) => stackId !== id);
		return [...filtered, id];
	});

	return () => deactivateStack(id);
}

// 스택 비활성화 (스택에서 제거)
export function deactivateStack(id: StackId) {
	stack.update((s) => s.filter((stackId) => stackId !== id));
}

// 단축키 취소 상태
export const isShortcutEscaped = writable<boolean>(false);
