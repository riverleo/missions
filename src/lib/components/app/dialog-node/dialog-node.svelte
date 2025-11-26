<script lang="ts">
	import { throttle } from 'radash';
	import { current, next, highlightedIndex } from './store';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Kbd } from '$lib/components/ui/kbd';
	import { open, roll, type DiceRoll } from '$lib/components/app/dice-roll/store';
	import { bind } from '$lib/shortcut/layers';
	import Message from './dialog-node-message.svelte';
	import { blur } from 'svelte/transition';

	function handleRoll(newDiceRoll: DiceRoll) {
		open(newDiceRoll);

		if (newDiceRoll.silent) next(roll());
	}

	bind({
		id: 'dialog-node',
		onkeyup: (event: KeyboardEvent) => {
			if ($current === undefined) return;

			const { type } = $current;

			if (type === 'narrative') {
				if (event.code === 'Space' || event.code === 'Enter') {
					handleRoll($current.diceRoll);
				}
			}

			if (type === 'choice') {
				if ($highlightedIndex !== undefined && (event.code === 'Enter' || event.code === 'Space')) {
					// Enter or Space to select highlighted choice
					handleRoll($current.choices[$highlightedIndex].diceRoll);
				}
			}
		},
		onkeydown: throttle({ interval: 100 }, (event: KeyboardEvent) => {
			if ($current === undefined) return;

			const { type } = $current;

			if (type !== 'choice') return;

			const choicesCount = $current.choices.length;

			if (
				event.code === 'ArrowDown' ||
				event.code === 'KeyS' ||
				event.code === 'ArrowUp' ||
				event.code === 'KeyW'
			) {
				if ($highlightedIndex === undefined) {
					$highlightedIndex = 0;
				} else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
					// Arrow Down or S key
					$highlightedIndex = ($highlightedIndex + 1) % choicesCount;
				} else if (event.code === 'ArrowUp' || event.code === 'KeyW') {
					// Arrow Up or W key
					$highlightedIndex = ($highlightedIndex - 1 + choicesCount) % choicesCount;
				}
			}
		}),
	});
</script>

<div
	class="fixed top-0 left-0 z-0 flex min-h-lvh w-full items-center justify-center bg-black/10 text-white backdrop-blur-sm"
	class:invisible={$current === undefined}
>
	<div class="flex flex-col items-center gap-8 px-8">
		<Message />
		{#if $current?.type === 'choice'}
			<div class="flex flex-col items-center gap-8 px-8">
				<div in:blur class="flex flex-col gap-3">
					{#each $current.choices as choice, index (choice.id)}
						<Button
							onclick={() => handleRoll(choice.diceRoll)}
							onmouseenter={() => ($highlightedIndex = index)}
						>
							{choice.text}
						</Button>
					{/each}
				</div>
			</div>
		{/if}

		{#if $current?.type === 'narrative'}
			<div class="flex flex-col items-center gap-8 px-8">
				<div in:blur>
					<Button onclick={() => handleRoll($current.diceRoll)}>
						다음 <Kbd>Space</Kbd>
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
