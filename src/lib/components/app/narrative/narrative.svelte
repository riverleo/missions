<script lang="ts">
	import { throttle } from 'radash';
	import { current, focusedNarrativeChoice, messageComplete, narrativeActionHeight } from './store';
	import { open } from '$lib/components/app/dice-roll/store';
	import Message from './narrative-message.svelte';
	import NarrativeAction from './narrative-action.svelte';
	import { isArrowDown, isArrowUp, isArrowUpOrDown, isEnterOrSpace } from '$lib/shortcut/utils';
	import { bindLayerEvent, type LayerId } from '$lib/shortcut/store';

	const layerId: LayerId = 'narrative';

	// Calculate transform values
	const messageTranslateY = $derived(
		$messageComplete && $current?.type === 'choice' ? -$narrativeActionHeight / 2 : 0
	);

	const actionTranslateY = $derived(
		$messageComplete && $current?.type === 'choice' ? $narrativeActionHeight / 2 : 0
	);

	bindLayerEvent({
		id: layerId,
		onkeyup: (event: KeyboardEvent) => {
			if ($current === undefined) return;

			const { type } = $current;

			if (isEnterOrSpace(event)) {
				switch (type) {
					case 'text':
						open($current.diceRoll);
						break;
					case 'choice':
						// Enter or Space to select highlighted choice
						if ($focusedNarrativeChoice !== undefined) open($focusedNarrativeChoice.diceRoll);
						break;
				}
			}
		},
		onkeydown: throttle({ interval: 100 }, (event: KeyboardEvent) => {
			if ($current === undefined) return;

			const { type } = $current;

			if (type !== 'choice') return;

			const choices = $current.choices;

			if (isArrowUpOrDown(event) && $focusedNarrativeChoice === undefined) {
				$focusedNarrativeChoice = choices[0];
			} else if (isArrowDown(event)) {
				const currentIndex = choices.findIndex((c) => c.id === $focusedNarrativeChoice?.id);
				const nextIndex = (currentIndex + 1) % choices.length;

				$focusedNarrativeChoice = choices[nextIndex];
			} else if (isArrowUp(event)) {
				const currentIndex = choices.findIndex((c) => c.id === $focusedNarrativeChoice?.id);
				const prevIndex = (currentIndex - 1 + choices.length) % choices.length;

				$focusedNarrativeChoice = choices[prevIndex];
			}
		}),
	});
</script>

<div
	class="fixed top-0 right-0 bottom-0 left-0 z-0 min-h-lvh items-center justify-center bg-black/10 backdrop-blur-sm"
	class:invisible={$current === undefined}
>
	<div
		class="absolute top-1/2 left-1/2 -translate-1/2 transition-transform duration-800"
		style="transform: translateY(calc(-50% + {messageTranslateY}px));"
	>
		<Message />
	</div>
	<div
		class="absolute top-1/2 left-1/2 mt-10 -translate-1/2 transition-transform duration-800"
		style="transform: translateY(calc(-50% + {actionTranslateY}px));"
	>
		<NarrativeAction />
	</div>
</div>
