<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { highlightedChoice, type NarrativeChoice } from './store';
	import { open } from '$lib/components/app/dice-roll/store';
	import type { LayerId } from '$lib/shortcut/store';

	const layerId: LayerId = 'narrative';

	type Props = WithElementRef<HTMLButtonAttributes> & {
		choice: NarrativeChoice;
		index: number;
	};

	let { choice, index, ...restProps }: Props = $props();
</script>

<button
	data-shortcut-key={$highlightedChoice?.id === choice.id ? 'Space Enter' : undefined}
	data-shortcut-effect="bounce"
	data-shortcut-layer={layerId}
	onclick={() => open(choice.diceRoll)}
	onmouseenter={() => ($highlightedChoice = choice)}
	class={cn('choice-item text-2xl blur-lg', {
		'opacity-20': $highlightedChoice?.id !== choice.id,
	})}
	style="animation-delay: {index * 200}ms"
	{...restProps}
>
	{choice.text}
</button>

<style>
	@keyframes blurIn {
		to {
			filter: blur(0);
		}
	}

	button {
		animation: blurIn 0.2s ease-out forwards;
	}
</style>
