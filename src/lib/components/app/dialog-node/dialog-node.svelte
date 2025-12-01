<script lang="ts">
	import { throttle } from 'radash';
	import { current, highlightedChoice } from './store';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Kbd } from '$lib/components/ui/kbd';
	import { open } from '$lib/components/app/dice-roll/store';
	import Message from './dialog-node-message.svelte';
	import { isArrowDown, isArrowUp, isArrowUpOrDown, isEnterOrSpace } from '$lib/shortcut/utils';
	import { bindLayerEvent, type LayerId } from '$lib/shortcut/store';
	import DialogNodeChoice from './dialog-node-choice.svelte';

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
		{#if $current?.type === 'choice'}
			<div class="flex flex-col items-center gap-3 px-8">
				{#each $current?.choices as choice, index (choice.id)}
					<DialogNodeChoice {choice} {index} />
				{/each}
			</div>
		{:else if $current?.type === 'narrative'}
			<div class="flex flex-col items-center gap-8 px-8">
				<Button
					variant="ghost"
					data-shortcut-key="Space Enter"
					data-shortcut-effect="bounce"
					data-shortcut-layer={layerId}
					onclick={() => open($current.diceRoll)}
				>
					{#if $current.diceRoll.difficultyClass > 0}
						주사위 굴리기
					{:else}
						다음
					{/if}
					<Kbd>Space</Kbd>
				</Button>
			</div>
		{/if}
	</div>
</div>
