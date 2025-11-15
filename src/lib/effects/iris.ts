import type { TransitionConfig } from 'svelte/transition';
import { cubicOut } from 'svelte/easing';

export function iris(_: Element, { duration = 400 }): TransitionConfig {
	return {
		duration,
		css: (t) => {
			const eased = cubicOut(t);
			return `
				clip-path: circle(${eased * 150}% at 50% 50%);
				opacity: ${eased};
			`;
		},
	};
}
