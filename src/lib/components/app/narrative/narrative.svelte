<script lang="ts">
	import { throttle } from 'radash';
	import {
		currentNarrativeNode,
		focusedNarrativeNodeChoice,
		messageComplete,
		narrativeActionHeight,
	} from './store';
	import { open } from '$lib/components/app/dice-roll/store';
	import Message from './narrative-message.svelte';
	import NarrativeAction from './narrative-action.svelte';
	import { isArrowDown, isArrowUp, isArrowUpOrDown, isEnterOrSpace } from '$lib/shortcut/utils';
	import { bindLayerEvent, type LayerId } from '$lib/shortcut/store';

	const layerId: LayerId = 'narrative';

	// Calculate transform values
	const messageTranslateY = $derived(
		$messageComplete && $currentNarrativeNode?.type === 'choice' ? -$narrativeActionHeight / 2 : 0
	);

	const actionTranslateY = $derived(
		$messageComplete && $currentNarrativeNode?.type === 'choice' ? $narrativeActionHeight / 2 : 0
	);

	bindLayerEvent({
		id: layerId,
		onkeyup: (event: KeyboardEvent) => {
			if ($currentNarrativeNode === undefined) return;

			const { type } = $currentNarrativeNode;

			if (isEnterOrSpace(event)) {
				switch (type) {
					case 'text':
						open($currentNarrativeNode.diceRoll);
						break;
					case 'choice':
						// Enter or Space to select highlighted choice
						if ($focusedNarrativeNodeChoice !== undefined)
							open($focusedNarrativeNodeChoice.diceRoll);
						break;
				}
			}
		},
		onkeydown: throttle({ interval: 100 }, (event: KeyboardEvent) => {
			if ($currentNarrativeNode === undefined) return;

			const { type } = $currentNarrativeNode;

			if (type !== 'choice') return;

			const choices = $currentNarrativeNode.choices;

			if (isArrowUpOrDown(event) && $focusedNarrativeNodeChoice === undefined) {
				$focusedNarrativeNodeChoice = choices[0];
			} else if (isArrowDown(event)) {
				const currentIndex = choices.findIndex((c) => c.id === $focusedNarrativeNodeChoice?.id);
				const nextIndex = (currentIndex + 1) % choices.length;

				$focusedNarrativeNodeChoice = choices[nextIndex];
			} else if (isArrowUp(event)) {
				const currentIndex = choices.findIndex((c) => c.id === $focusedNarrativeNodeChoice?.id);
				const prevIndex = (currentIndex - 1 + choices.length) % choices.length;

				$focusedNarrativeNodeChoice = choices[prevIndex];
			}
		}),
	});
</script>

<div
	class="fixed top-0 right-0 bottom-0 left-0 z-0 min-h-lvh items-center justify-center bg-black/10 backdrop-blur-sm"
	class:invisible={$currentNarrativeNode === undefined}
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
