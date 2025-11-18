<script lang="ts">
	import { open, close, dialogNode } from './store';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Kbd } from '$lib/components/ui/kbd';
	import type { DiceRoll } from '$lib/components/dice-roll';
	import { roll } from '$lib/components/dice-roll/store';

	function next(diceRoll: DiceRoll) {
		const diceRolled = roll(diceRoll);

		// Dice roll is not silent, so we wait for the result
		if (diceRolled === undefined) return;

		const { action } = diceRolled;

		if (action.type === 'exit') {
			return close();
		}

		if (action.type === 'dialogNode') {
			return open(action.dialogNodeId);
		}
	}
</script>

{#if $dialogNode}
	<div
		class="fixed top-0 left-0 z-0 flex min-h-lvh w-full items-center justify-center bg-black/50 text-white"
	>
		<div class="flex flex-col items-center gap-4">
			<p>{$dialogNode.text}</p>
			{#if $dialogNode.type === 'choices'}
				{#each $dialogNode.choices as choice (choice.id)}
					<Button onclick={() => next(choice.diceRoll)}>
						{choice.text}
					</Button>
				{/each}
			{:else}
				<Button onclick={() => next($dialogNode.diceRoll)}>다음 <Kbd>Space</Kbd></Button>
			{/if}
		</div>
	</div>
{/if}
