<script lang="ts">
	import { throttle } from 'radash';
	import { current, next, highlightedIndex } from './store';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Kbd } from '$lib/components/ui/kbd';
	import { open, roll, type DiceRoll } from '$lib/components/dice-roll/store';
	import { register } from '$lib/shortcut/layers';

	function handleRoll(newDiceRoll: DiceRoll) {
		open(newDiceRoll);

		if (newDiceRoll.silent) next(roll());
	}

	const onkeydown = throttle({ interval: 100 }, (event: KeyboardEvent) => {
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
	});

	const onkeyup = (event: KeyboardEvent) => {
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
	};

	// 레이어 등록
	register({ id: 'dialog-node', onkeyup, onkeydown });
</script>

{#if $current}
	<div
		class="fixed top-0 left-0 z-0 flex min-h-lvh w-full items-center justify-center bg-black/50 text-white"
	>
		<div class="flex flex-col items-center gap-4">
			<p>{$current.text}</p>
			{#if $current.type === 'choice'}
				{#each $current.choices as choice, index (choice.id)}
					<Button
						onclick={() => handleRoll(choice.diceRoll)}
						onmouseenter={() => ($highlightedIndex = index)}
						class={$highlightedIndex === index ? 'ring-2 ring-white' : ''}
					>
						{choice.text}
					</Button>
				{/each}
			{:else}
				<Button onclick={() => handleRoll($current.diceRoll)}>다음 <Kbd>Space</Kbd></Button>
			{/if}
		</div>
	</div>
{/if}
