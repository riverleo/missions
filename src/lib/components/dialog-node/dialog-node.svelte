<script lang="ts">
	import { current, next } from './store';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Kbd } from '$lib/components/ui/kbd';
	import type { DiceRoll } from '$lib/components/dice-roll';
	import { roll } from '$lib/components/dice-roll/store';

	function handleNext(diceRoll: DiceRoll) {
		const diceRolled = roll(diceRoll);

		// Dice roll is not silent, so we wait for the result
		if (diceRolled === undefined) return;

		next(diceRolled);
	}
</script>

{#if $current}
	<div
		class="fixed top-0 left-0 z-0 flex min-h-lvh w-full items-center justify-center bg-black/50 text-white"
	>
		<div class="flex flex-col items-center gap-4">
			<p>{$current.text}</p>
			{#if $current.type === 'choices'}
				{#each $current.choices as choice (choice.id)}
					<Button onclick={() => handleNext(choice.diceRoll)}>
						{choice.text}
					</Button>
				{/each}
			{:else}
				<Button onclick={() => handleNext($current.diceRoll)}>다음 <Kbd>Space</Kbd></Button>
			{/if}
		</div>
	</div>
{/if}
