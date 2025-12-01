<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { focusedNarrativeChoice, type NarrativeChoice } from './store';
	import { open } from '$lib/components/app/dice-roll/store';
	import type { LayerId } from '$lib/shortcut/store';

	const layerId: LayerId = 'narrative';

	type Props = WithElementRef<HTMLButtonAttributes> & {
		narrativeChoice: NarrativeChoice;
		index: number;
	};

	let { narrativeChoice, index, ...restProps }: Props = $props();
</script>

<button
	data-shortcut-key={$focusedNarrativeChoice?.id === narrativeChoice.id ? 'Space Enter' : undefined}
	data-shortcut-effect="bounce"
	data-shortcut-layer={layerId}
	onclick={() => open(narrativeChoice.diceRoll)}
	onmouseenter={() => ($focusedNarrativeChoice = narrativeChoice)}
	class={cn('text-2xl blur-3xl', {
		'opacity-20': $focusedNarrativeChoice?.id !== narrativeChoice.id,
	})}
	style="animation-delay: {index * 300}ms"
	{...restProps}
>
	{narrativeChoice.text}
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
