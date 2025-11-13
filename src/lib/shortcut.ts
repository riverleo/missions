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
		e.dataset.shortcutBounce = '';

		setTimeout(() => delete e.dataset.shortcutBounce, 150);
	});
}
