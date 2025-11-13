function playSound() {
	try {
		const audioContext = new AudioContext();
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);

		// 짧고 경쾌한 클릭 사운드
		oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
		oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.05);

		gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);

		oscillator.start(audioContext.currentTime);
		oscillator.stop(audioContext.currentTime + 0.05);
	} catch (error) {
		console.warn('Failed to play shortcut sound:', error);
	}
}

function triggerButtonEffect(element: HTMLElement) {
	element.dataset.shortcutBounce = '';
	playSound();
	setTimeout(() => delete element.dataset.shortcutBounce, 150);
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
