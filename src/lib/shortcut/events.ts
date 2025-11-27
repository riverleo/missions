import { getShortcut, keymap } from './keymap.js';
import sounds from './sounds.js';
import { get } from 'svelte/store';
import { currentLayerId, layers, isShortcutEscaped } from './store.js';
import { isEnterOrSpace, isEscape } from './utils.js';

const effectTimeouts = new WeakMap<HTMLElement, NodeJS.Timeout>();

function clearAllEffects() {
	const activeElements = document.querySelectorAll<HTMLElement>('[data-shortcut-effect-active]');

	activeElements.forEach((activeElement) => {
		const existingTimeout = effectTimeouts.get(activeElement);
		if (existingTimeout !== undefined) {
			clearTimeout(existingTimeout);
			effectTimeouts.delete(activeElement);
		}
		delete activeElement.dataset.shortcutEffectActive;
	});
}

function triggerKeyUpEffect(element: HTMLElement) {
	if ((element as HTMLButtonElement).disabled) return;
	if (element.dataset.shortcutEffect === undefined) return;

	const { shortcutEffect = 'bounce' } = element.dataset;

	// keyup: effect-up 값으로 변경하여 애니메이션 트리거
	sounds.play('warp');
	element.dataset.shortcutEffectActive = `${shortcutEffect}-up`;

	const timeout = setTimeout(() => {
		delete element.dataset.shortcutEffectActive;
		effectTimeouts.delete(element);
	}, 400);

	effectTimeouts.set(element, timeout);
}

function triggerKeyDownEffect(element: HTMLElement) {
	if ((element as HTMLButtonElement).disabled) return;
	if (element.dataset.shortcutEffect === undefined) return;

	const { shortcutEffect = 'bounce' } = element.dataset;

	// keydown: effect-down 값으로 눌린 상태 표시
	if (element.dataset.shortcutEffectActive === undefined) {
		element.dataset.shortcutEffectActive = `${shortcutEffect}-down`;
	}
}

export function onkeydown(event: KeyboardEvent) {
	// ESC 키로 단축키 취소
	if (isEscape(event)) {
		isShortcutEscaped.set(true);

		return clearAllEffects();
	}

	// 레이어 단축키 처리
	const $currentLayerId = get(currentLayerId);

	if ($currentLayerId) {
		event.preventDefault();

		get(layers)[$currentLayerId].onkeydown?.(event);
	}

	// 포커스된 요소가 data-shortcut-effect를 가지고 있을 때
	const focusedElement = document.activeElement as HTMLElement;

	if (focusedElement && isEnterOrSpace(event)) {
		triggerKeyDownEffect(focusedElement);
	}

	// data-shortcut 속성을 가진 요소들의 시각적 피드백 처리
	const elements = document.querySelectorAll<HTMLElement>('[data-shortcut]');

	elements.forEach((element) => {
		const shortcut = getShortcut(element.dataset.shortcut);

		if (shortcut?.match(event)) triggerKeyDownEffect(element);
	});

	// data-shortcut-key 속성을 가진 요소들의 시각적 피드백 처리
	const keyElements = document.querySelectorAll<HTMLElement>('[data-shortcut-key]');

	keyElements.forEach((element) => {
		// 공백으로 구분된 키들을 배열로 변환
		const keyList = element.dataset.shortcutKey?.split(/\s+/).filter((k) => k);

		// 현재 이벤트 키가 목록에 있는지 확인
		if (keyList?.includes(event.code)) triggerKeyDownEffect(element);
	});
}

export function onkeyup(event: KeyboardEvent) {
	// 취소된 상태면 효과만 정리하고 action은 실행하지 않음
	if (!isEscape(event) && get(isShortcutEscaped)) {
		isShortcutEscaped.set(false);

		return clearAllEffects();
	}

	// data-shortcut 속성을 가진 요소들의 시각적 피드백 처리
	const elements = document.querySelectorAll<HTMLElement>('[data-shortcut-effect]');

	elements.forEach((e) => {
		const shortcut = getShortcut(e.dataset.shortcut);

		if (shortcut?.match(event)) triggerKeyUpEffect(e);
	});

	// data-shortcut-key 속성을 가진 요소들의 시각적 피드백 처리
	const keyElements = document.querySelectorAll<HTMLElement>('[data-shortcut-key]');

	keyElements.forEach((element) => {
		// 공백으로 구분된 키들을 배열로 변환
		const keyList = element.dataset.shortcutKey?.split(/\s+/).filter((k) => k);

		// 현재 이벤트 키가 목록에 있는지 확인
		if (keyList?.includes(event.code)) triggerKeyUpEffect(element);
	});

	// 레이어 단축키 처리
	const $currentLayerId = get(currentLayerId);

	if ($currentLayerId) {
		event.preventDefault();

		return get(layers)[$currentLayerId].onkeyup?.(event);
	}

	// 포커스된 요소가 data-shortcut-effect를 가지고 있고 스페이스바나 엔터를 떼면 active 제거 및 효과 실행
	const focusedElement = document.activeElement as HTMLElement | null;

	if (isEnterOrSpace(event) && focusedElement) {
		return triggerKeyUpEffect(focusedElement);
	}

	// 글로벌 단축키 처리
	for (const shortcut of Object.values(keymap)) {
		if (!shortcut.match(event)) continue;

		event.preventDefault();
		shortcut.action();
	}
}

export function onmousedown(event: MouseEvent) {
	const target = event.target as HTMLElement;
	const element = target.closest<HTMLElement>('[data-shortcut-effect]');

	if (element) triggerKeyDownEffect(element);
}

export function onmouseup(event: MouseEvent) {
	const target = event.target as HTMLElement;
	const element = target.closest<HTMLElement>('[data-shortcut-effect]');

	if (element) triggerKeyUpEffect(element);
	else clearAllEffects();
}

export function onmouseover(event: MouseEvent) {
	const target = event.target as HTMLElement;
	const element = target.closest<HTMLElement>('[data-shortcut-effect]');

	if (element) sounds.play('hover');
}
