export function isEscape(event: KeyboardEvent) {
	return event.code === 'Escape';
}

export function isEnterOrSpace(event: KeyboardEvent) {
	return event.code === 'Enter' || event.code === 'Space';
}

export function isArrowUp(event: KeyboardEvent) {
	return event.code === 'ArrowUp' || event.code === 'KeyW';
}

export function isArrowDown(event: KeyboardEvent) {
	return event.code === 'ArrowDown' || event.code === 'KeyS';
}

export function isArrowUpOrDown(event: KeyboardEvent) {
	return isArrowUp(event) || isArrowDown(event);
}
