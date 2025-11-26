import map from './map.js';
import sounds from './sounds.js';
import { get } from 'svelte/store';
import { current as currentLayer, layers } from './layers.js';

const bounceTimeouts = new WeakMap<HTMLElement, NodeJS.Timeout>();

function triggerEffect(element: HTMLElement) {
	// 이전 timeout이 있으면 취소
	const existingTimeout = bounceTimeouts.get(element);
	if (existingTimeout !== undefined) {
		clearTimeout(existingTimeout);
	}

	element.dataset.shortcutBounce = '';
	sounds.play('warp');

	const timeoutId = setTimeout(() => {
		delete element.dataset.shortcutBounce;
		bounceTimeouts.delete(element);
	}, 400);

	bounceTimeouts.set(element, timeoutId);
}

export function onkeydown(event: KeyboardEvent) {
	// 레이어 단축키 처리
	const currentId = get(currentLayer);
	if (currentId) {
		event.preventDefault();

		get(layers)[currentId].onkeydown?.(event);
	}

	// 포커스된 요소가 data-shortcut을 가지고 있고 스페이스바나 엔터를 누르면 active 상태 추가
	const focusedElement = document.activeElement as HTMLElement;
	if (
		focusedElement &&
		focusedElement.hasAttribute('data-shortcut') &&
		(event.code === 'Space' || event.code === 'Enter')
	) {
		if (!focusedElement.dataset.shortcutActive) {
			focusedElement.dataset.shortcutActive = '';
		}
		return;
	}

	// data-shortcut 속성을 가진 요소들의 시각적 피드백 처리
	const elements = document.querySelectorAll<HTMLElement>('[data-shortcut]');

	elements.forEach((e) => {
		const bindingId = e.dataset.shortcut;
		if (!bindingId) return;

		const binding = map[bindingId as keyof typeof map];
		if (!binding) return;

		if (binding.match(event)) {
			if (e.dataset.shortcutActive) return;
			e.dataset.shortcutActive = '';
		}
	});
}

export function onkeyup(event: KeyboardEvent) {
	// 레이어 단축키 처리
	const currentId = get(currentLayer);
	if (currentId) {
		event.preventDefault();

		get(layers)[currentId].onkeyup?.(event);
	}

	// 포커스된 요소가 data-shortcut을 가지고 있고 스페이스바나 엔터를 떼면 active 제거 및 bounce 효과
	const focusedElement = document.activeElement as HTMLElement;
	if (
		focusedElement &&
		focusedElement.hasAttribute('data-shortcut') &&
		(event.code === 'Space' || event.code === 'Enter') &&
		focusedElement.dataset.shortcutActive !== undefined
	) {
		delete focusedElement.dataset.shortcutActive;
		triggerEffect(focusedElement);
		return;
	}

	// 글로벌 단축키 처리
	for (const binding of Object.values(map)) {
		if (binding.match(event)) {
			event.preventDefault();
			binding.action();
			break;
		}
	}

	// data-shortcut 속성을 가진 요소들의 시각적 피드백 처리
	const elements = document.querySelectorAll<HTMLElement>('[data-shortcut]');

	elements.forEach((e) => {
		const bindingId = e.dataset.shortcut;
		if (!bindingId) return;

		const binding = map[bindingId as keyof typeof map];
		if (!binding) return;

		if (binding.match(event)) {
			if (e.dataset.shortcutActive === undefined) return;

			delete e.dataset.shortcutActive;
			triggerEffect(e);
		}
	});
}

export function onmousedown(event: MouseEvent) {
	const target = event.target as HTMLElement;
	const element = target.closest<HTMLElement>('[data-shortcut]');

	if (!element) return;

	// active 상태 추가
	element.dataset.shortcutActive = '';
}

export function onmouseup(event: MouseEvent) {
	const target = event.target as HTMLElement;
	const element = target.closest<HTMLElement>('[data-shortcut]');

	// active 상태인 모든 요소 찾기
	const activeElements = document.querySelectorAll<HTMLElement>('[data-shortcut-active]');

	activeElements.forEach((activeElement) => {
		delete activeElement.dataset.shortcutActive;

		// 실제로 클릭한 요소에만 bounce 효과 적용
		if (element && activeElement === element) {
			triggerEffect(element);
		}
	});
}
