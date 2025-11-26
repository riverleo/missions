import map from './map.js';
import sounds from './sounds.js';
import { get } from 'svelte/store';
import { current, layers } from './layers.js';

const effectTimeouts = new WeakMap<HTMLElement, NodeJS.Timeout>();

function triggerEffect(element: HTMLElement) {
	// shortcutEffect 속성이 없으면 애니메이션 없이 리턴
	if (!element.hasAttribute('data-shortcut-effect')) return;

	// effect 값이 없거나 빈 문자열이면 기본값 'bounce' 사용
	const effect = element.dataset.shortcutEffect || 'bounce';

	// 이전 timeout이 있으면 취소
	const existingTimeout = effectTimeouts.get(element);
	if (existingTimeout !== undefined) {
		clearTimeout(existingTimeout);
	}

	// effect 타입에 따라 data attribute 설정
	element.dataset.shortcutEffectActive = effect;
	sounds.play('warp');

	const timeoutId = setTimeout(() => {
		delete element.dataset.shortcutEffectActive;
		effectTimeouts.delete(element);
	}, 400);

	effectTimeouts.set(element, timeoutId);
}

export function onkeydown(event: KeyboardEvent) {
	// 레이어 단축키 처리
	const currentLayerId = get(current);

	if (currentLayerId) {
		event.preventDefault();

		get(layers)[currentLayerId].onkeydown?.(event);
	}

	// 포커스된 요소가 data-shortcut-effect를 가지고 있고 스페이스바나 엔터를 누르면 active 상태 추가
	const focusedElement = document.activeElement as HTMLElement;
	if (
		focusedElement &&
		focusedElement.hasAttribute('data-shortcut-effect') &&
		(event.code === 'Space' || event.code === 'Enter')
	) {
		if (!focusedElement.dataset.shortcutEffectActive) {
			focusedElement.dataset.shortcutEffectActive = '';
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
			if (e.dataset.shortcutEffectActive) return;
			e.dataset.shortcutEffectActive = '';
		}
	});

	// data-shortcut-key 속성을 가진 요소들의 시각적 피드백 처리
	const keyElements = document.querySelectorAll<HTMLElement>('[data-shortcut-key]');

	keyElements.forEach((e) => {
		const keys = e.dataset.shortcutKey;
		if (!keys) return;

		// 공백으로 구분된 키들을 배열로 변환
		const keyList = keys.split(/\s+/).filter((k) => k);

		// 현재 이벤트 키가 목록에 있는지 확인
		if (keyList.includes(event.code)) {
			if (e.dataset.shortcutEffectActive) return;
			e.dataset.shortcutEffectActive = '';
		}
	});
}

export function onkeyup(event: KeyboardEvent) {
	// 레이어 단축키 처리
	const currentId = get(current);

	if (currentId) {
		event.preventDefault();

		get(layers)[currentId].onkeyup?.(event);
	}

	// 포커스된 요소가 data-shortcut-effect를 가지고 있고 스페이스바나 엔터를 떼면 active 제거 및 효과 실행
	const focusedElement = document.activeElement as HTMLElement;
	if (
		focusedElement &&
		focusedElement.hasAttribute('data-shortcut-effect') &&
		(event.code === 'Space' || event.code === 'Enter') &&
		focusedElement.dataset.shortcutEffectActive !== undefined
	) {
		delete focusedElement.dataset.shortcutEffectActive;
		triggerEffect(focusedElement);
		return;
	}

	// 글로벌 단축키 처리
	for (const shortcut of Object.values(map)) {
		if (shortcut.match(event)) {
			event.preventDefault();
			shortcut.action();
			break;
		}
	}

	// data-shortcut 속성을 가진 요소들의 시각적 피드백 처리
	const elements = document.querySelectorAll<HTMLElement>('[data-shortcut-effect]');

	elements.forEach((e) => {
		const bindingId = e.dataset.shortcut;
		if (!bindingId) return;

		const binding = map[bindingId as keyof typeof map];
		if (!binding) return;

		if (binding.match(event)) {
			if (e.dataset.shortcutEffectActive === undefined) return;

			delete e.dataset.shortcutEffectActive;
			triggerEffect(e);
		}
	});

	// data-shortcut-key 속성을 가진 요소들의 시각적 피드백 처리
	const keyElements = document.querySelectorAll<HTMLElement>('[data-shortcut-key]');

	keyElements.forEach((e) => {
		const keys = e.dataset.shortcutKey;
		if (!keys) return;

		// 공백으로 구분된 키들을 배열로 변환
		const keyList = keys.split(/\s+/).filter((k) => k);

		// 현재 이벤트 키가 목록에 있는지 확인
		if (keyList.includes(event.code)) {
			if (e.dataset.shortcutEffectActive === undefined) return;

			delete e.dataset.shortcutEffectActive;
			triggerEffect(e);
		}
	});
}

export function onmousedown(event: MouseEvent) {
	const target = event.target as HTMLElement;
	const element = target.closest<HTMLElement>('[data-shortcut-effect]');

	if (!element) return;

	// active 상태 추가
	element.dataset.shortcutEffectActive = '';
}

export function onmouseup(event: MouseEvent) {
	const target = event.target as HTMLElement;
	const element = target.closest<HTMLElement>('[data-shortcut-effect]');

	// active 상태인 모든 요소 찾기
	const activeElements = document.querySelectorAll<HTMLElement>('[data-shortcut-effect-active]');

	activeElements.forEach((activeElement) => {
		delete activeElement.dataset.shortcutEffectActive;

		// 실제로 클릭한 요소에만 효과 적용
		if (element && activeElement === element) {
			triggerEffect(element);
		}
	});
}

export function onmouseover(event: MouseEvent) {
	const target = event.target as HTMLElement;
	const element = target.closest<HTMLElement>('[data-shortcut-effect]');

	if (!element) return;

	sounds.play('hover');
}
