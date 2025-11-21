import sounds from './sounds.js';
import { keymap } from './keymap.js';
import { get } from 'svelte/store';
import { current as currentLayer, layers } from './layers.js';

const bounceTimeouts = new WeakMap<HTMLElement, NodeJS.Timeout>();

function triggerButtonEffect(element: HTMLElement) {
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
	}, 150);

	bounceTimeouts.set(element, timeoutId);
}

export function onkeydown(event: KeyboardEvent) {
	// 레이어 단축키 처리
	const currentId = get(currentLayer);
	if (currentId) {
		event.preventDefault();

		get(layers)[currentId].onkeydown?.(event);
	}

	// data-keybinding 속성을 가진 요소들의 시각적 피드백 처리
	const elements = document.querySelectorAll<HTMLElement>('[data-keybinding]');

	elements.forEach((e) => {
		const bindingId = e.dataset.keybinding;
		if (!bindingId) return;

		const binding = keymap[bindingId as keyof typeof keymap];
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

	// 글로벌 단축키 처리
	for (const binding of Object.values(keymap)) {
		if (binding.match(event)) {
			event.preventDefault();
			binding.action();
			break;
		}
	}

	// data-keybinding 속성을 가진 요소들의 시각적 피드백 처리
	const elements = document.querySelectorAll<HTMLElement>('[data-keybinding]');

	elements.forEach((e) => {
		const bindingId = e.dataset.keybinding;
		if (!bindingId) return;

		const binding = keymap[bindingId as keyof typeof keymap];
		if (!binding) return;

		if (binding.match(event)) {
			if (e.dataset.shortcutActive === undefined) return;

			delete e.dataset.shortcutActive;
			triggerButtonEffect(e);
		}
	});
}

export function onmousedown(event: MouseEvent) {
	const target = event.target as HTMLElement;
	const element = target.closest<HTMLElement>('[data-keybinding]');

	if (
		element &&
		!element.hasAttribute('disabled') &&
		element.getAttribute('aria-disabled') !== 'true'
	) {
		element.dataset.shortcutActive = '';
	}
}

export function onmouseup(event: MouseEvent) {
	const target = event.target as HTMLElement;
	const element = target.closest<HTMLElement>('[data-keybinding]');

	if (element && element.dataset.shortcutActive !== undefined) {
		delete element.dataset.shortcutActive;
		triggerButtonEffect(element);
	}
}

export function onmouseleave(event: MouseEvent) {
	const target = event.target as HTMLElement;
	const element = target.closest<HTMLElement>('[data-keybinding]');

	if (element && element.dataset.shortcutActive !== undefined) {
		delete element.dataset.shortcutActive;
	}
}
