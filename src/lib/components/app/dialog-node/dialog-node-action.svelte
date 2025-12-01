<script lang="ts">
	import { current, highlightedChoice } from './store';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Kbd } from '$lib/components/ui/kbd';
	import { open } from '$lib/components/app/dice-roll/store';
	import DialogNodeChoice from './dialog-node-choice.svelte';
	import type { LayerId } from '$lib/shortcut/store';

	const layerId: LayerId = 'dialog-node';
</script>

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
