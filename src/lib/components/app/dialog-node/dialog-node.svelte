<script lang="ts">
	import { throttle } from 'radash';
	import { current, next, highlightedIndex } from './store';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Kbd } from '$lib/components/ui/kbd';
	import { open, roll, type DiceRoll } from '$lib/components/app/dice-roll/store';
	import {
		current as currentLayerId,
		bind as bindLayerEvent,
		type LayerId,
	} from '$lib/shortcut/layers';
	import Message from './dialog-node-message.svelte';
	import { blur } from 'svelte/transition';

	const layerId: LayerId = 'dialog-node';

	function handleRoll(newDiceRoll: DiceRoll) {
		open(newDiceRoll);

		if (newDiceRoll.silent) next(roll());
	}

	bindLayerEvent({
		id: layerId,
		onkeyup: (event: KeyboardEvent) => {
			if ($current === undefined) return;

			const { type } = $current;

			if (type === 'narrative' && (event.code === 'Space' || event.code === 'Enter'))
				handleRoll($current.diceRoll);

			// Enter or Space to select highlighted choice
			if (
				type === 'choice' &&
				$highlightedIndex !== undefined &&
				(event.code === 'Enter' || event.code === 'Space')
			)
				handleRoll($current.choices[$highlightedIndex].diceRoll);
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
	class="fixed top-0 left-0 z-0 flex min-h-lvh w-full items-center justify-center bg-black/10 backdrop-blur-sm"
	class:invisible={$current === undefined}
>
	<div class="flex flex-col items-center gap-8 px-8">
		<Message />
		{#if $current?.type === 'choice'}
			<div class="flex flex-col items-center gap-8 px-8">
				<div in:blur class="flex flex-col gap-3">
					{#each $current.choices as choice, index (choice.id)}
						<Button
							variant="ghost"
							data-shortcut-key={$highlightedIndex === index ? 'Space Enter' : ''}
							data-shortcut-effect
							onclick={() => handleRoll(choice.diceRoll)}
							onmouseenter={() => ($highlightedIndex = index)}
							disabled={$currentLayerId !== layerId}
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
					<Button
						variant="ghost"
						data-shortcut-key="Space Enter"
						data-shortcut-effect
						onclick={() => handleRoll($current.diceRoll)}
						disabled={$currentLayerId !== layerId}
					>
						다음 <Kbd>Space</Kbd>
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
