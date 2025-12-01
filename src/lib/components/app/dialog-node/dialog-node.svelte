<script lang="ts">
	import { throttle } from 'radash';
	import { current, highlightedChoice } from './store';
	import { open } from '$lib/components/app/dice-roll/store';
	import Message from './dialog-node-message.svelte';
	import DialogNodeAction from './dialog-node-action.svelte';
	import { isArrowDown, isArrowUp, isArrowUpOrDown, isEnterOrSpace } from '$lib/shortcut/utils';
	import { bindLayerEvent, type LayerId } from '$lib/shortcut/store';

	const layerId: LayerId = 'dialog-node';

	bindLayerEvent({
		id: layerId,
		onkeyup: (event: KeyboardEvent) => {
			if ($current === undefined) return;

			const { type } = $current;

			if (isEnterOrSpace(event)) {
				switch (type) {
					case 'narrative':
						open($current.diceRoll);
						break;
					case 'choice':
						// Enter or Space to select highlighted choice
						if ($highlightedChoice !== undefined) open($highlightedChoice.diceRoll);
						break;
				}
			}
		},
		onkeydown: throttle({ interval: 100 }, (event: KeyboardEvent) => {
			if ($current === undefined) return;

			const { type } = $current;

			if (type !== 'choice') return;

			const choices = $current.choices;

			if (isArrowUpOrDown(event) && $highlightedChoice === undefined) {
				$highlightedChoice = choices[0];
			} else if (isArrowDown(event)) {
				const currentIndex = choices.findIndex((c) => c.id === $highlightedChoice?.id);
				const nextIndex = (currentIndex + 1) % choices.length;

				$highlightedChoice = choices[nextIndex];
			} else if (isArrowUp(event)) {
				const currentIndex = choices.findIndex((c) => c.id === $highlightedChoice?.id);
				const prevIndex = (currentIndex - 1 + choices.length) % choices.length;

				$highlightedChoice = choices[prevIndex];
			}
		}),
	});
</script>

<div
	class="fixed top-0 left-0 z-0 flex min-h-lvh w-full items-center justify-center bg-black/10 backdrop-blur-sm"
	class:invisible={$current === undefined}
>
	<div class="flex flex-col items-center gap-8 px-8">
		<Message />
		<DialogNodeAction />
	</div>
</div>
