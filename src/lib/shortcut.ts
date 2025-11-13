let audioContext: AudioContext | null = null;

function getAudioContext() {
	if (!audioContext) {
		audioContext = new AudioContext();
	}
	return audioContext;
}

function playSound() {
	try {
		const ctx = getAudioContext();
		const oscillator = ctx.createOscillator();
		const gainNode = ctx.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(ctx.destination);

		// 짧고 경쾌한 클릭 사운드
		oscillator.frequency.setValueAtTime(800, ctx.currentTime);
		oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);

		gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

		oscillator.start(ctx.currentTime);
		oscillator.stop(ctx.currentTime + 0.05);
	} catch (error) {
		console.warn('Failed to play shortcut sound:', error);
	}
}

const bounceTimeouts = new WeakMap<HTMLElement, NodeJS.Timeout>();

function triggerButtonEffect(element: HTMLElement) {
	// 이전 timeout이 있으면 취소
	const existingTimeout = bounceTimeouts.get(element);
	if (existingTimeout !== undefined) {
		clearTimeout(existingTimeout);
	}

	element.dataset.shortcutBounce = '';
	playSound();

	const timeoutId = setTimeout(() => {
		delete element.dataset.shortcutBounce;
		bounceTimeouts.delete(element);
	}, 150);

	bounceTimeouts.set(element, timeoutId);
}

export function onkeydown(event: KeyboardEvent & { currentTarget: EventTarget & Window }) {
	const { code } = event;
	const shortcut = code.substring(3).toLowerCase();
	const elements = document.querySelectorAll<HTMLElement>(`[data-shortcut="${shortcut}"]`);

	elements.forEach((e) => {
		if (e.dataset.shortcutActive) return;

		e.dataset.shortcutActive = '';
	});
}

export function onkeyup(event: KeyboardEvent & { currentTarget: EventTarget & Window }) {
	const { code } = event;
	const shortcut = code.substring(3).toLowerCase();
	const elements = document.querySelectorAll<HTMLElement>(`[data-shortcut="${shortcut}"]`);

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
