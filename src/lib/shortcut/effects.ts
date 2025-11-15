import sounds from './sounds.js';

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

export function onkeydown(event: KeyboardEvent & { currentTarget: EventTarget & Window }) {
	const elements = document.querySelectorAll<HTMLElement>(`[data-shortcut="${event.code}"]`);

	elements.forEach((e) => {
		if (e.dataset.shortcutActive) return;

		e.dataset.shortcutActive = '';
	});
}

export function onkeyup(event: KeyboardEvent & { currentTarget: EventTarget & Window }) {
	const elements = document.querySelectorAll<HTMLElement>(`[data-shortcut="${event.code}"]`);

	elements.forEach((e) => {
		if (e.dataset.shortcutActive === undefined) return;

		delete e.dataset.shortcutActive;
		triggerButtonEffect(e);
	});
}

export function onmousedown(event: MouseEvent & { currentTarget: EventTarget & Window }) {
	const target = event.target as HTMLElement;
	const element = target.closest<HTMLElement>('[data-shortcut]');

	if (
		element &&
		!element.hasAttribute('disabled') &&
		element.getAttribute('aria-disabled') !== 'true'
	) {
		element.dataset.shortcutActive = '';
	}
}

export function onmouseup(event: MouseEvent & { currentTarget: EventTarget & Window }) {
	const target = event.target as HTMLElement;
	const element = target.closest<HTMLElement>('[data-shortcut]');

	if (element && element.dataset.shortcutActive !== undefined) {
		delete element.dataset.shortcutActive;
		triggerButtonEffect(element);
	}
}

export function onmouseleave(event: MouseEvent & { currentTarget: EventTarget & Window }) {
	const target = event.target as HTMLElement;
	const element = target.closest<HTMLElement>('[data-shortcut]');

	if (element && element.dataset.shortcutActive !== undefined) {
		delete element.dataset.shortcutActive;
	}
}
