<script lang="ts">
	import { throttle } from 'radash';
	import { current, next, highlightedIndex } from './store';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Kbd } from '$lib/components/ui/kbd';
	import { open, roll, type DiceRoll } from '$lib/components/app/dice-roll/store';
	import Message from './dialog-node-message.svelte';
	import { blur } from 'svelte/transition';
	import { isArrowDown, isArrowUp, isArrowUpOrDown, isEnterOrSpace } from '$lib/shortcut/utils';
	import { bindLayerEvent, currentLayerId, type LayerId } from '$lib/shortcut/store';

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

			if (isEnterOrSpace(event)) {
				switch (type) {
					case 'narrative':
						handleRoll($current.diceRoll);
						break;
					case 'choice':
						// Enter or Space to select highlighted choice
						if ($highlightedIndex !== undefined)
							handleRoll($current.choices[$highlightedIndex].diceRoll);
						break;
				}
			}
		},
		onkeydown: throttle({ interval: 100 }, (event: KeyboardEvent) => {
			if ($current === undefined) return;

			const { type } = $current;

			if (type !== 'choice') return;

			const choicesCount = $current.choices.length;

			if (isArrowUpOrDown(event) && $highlightedIndex === undefined) {
				$highlightedIndex = 0;
			} else if (isArrowDown(event)) {
				// Arrow Down or S key
				$highlightedIndex = (($highlightedIndex ?? 0) + 1) % choicesCount;
			} else if (isArrowUp(event)) {
				// Arrow Up or W key
				$highlightedIndex = (($highlightedIndex ?? 0) - 1 + choicesCount) % choicesCount;
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
							data-shortcut-key={$highlightedIndex === index ? 'Space Enter' : undefined}
							data-shortcut-effect="bounce"
							onclick={() => handleRoll(choice.diceRoll)}
							onmouseenter={() => ($highlightedIndex = index)}
							disabled={$currentLayerId !== layerId}
							class={$highlightedIndex === index ? 'opacity-100' : 'opacity-20'}
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
						data-shortcut-effect="bounce"
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
