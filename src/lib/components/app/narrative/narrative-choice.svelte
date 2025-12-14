<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { useNarrative } from '$lib/hooks/use-narrative';
	import type { NarrativeNodeChoice } from '$lib/types';
	import type { LayerId } from '$lib/shortcut/store';

	const layerId: LayerId = 'narrative';

	const { play } = useNarrative();
	const playStore = play.store;

	type Props = WithElementRef<HTMLButtonAttributes> & {
		narrativeNodeChoice: NarrativeNodeChoice;
		index: number;
	};

	let { narrativeNodeChoice, index, ...restProps }: Props = $props();
</script>

<button
	data-shortcut-key={$playStore.selectedNarrativeNodeChoice?.id === narrativeNodeChoice.id
		? 'Space Enter'
		: undefined}
	data-shortcut-effect="bounce"
	data-shortcut-layer={layerId}
	onclick={() => play.select(narrativeNodeChoice)}
	onmouseenter={() => play.highlight(narrativeNodeChoice)}
	class={cn('text-2xl blur-3xl', {
		'opacity-20': $playStore.selectedNarrativeNodeChoice?.id !== narrativeNodeChoice.id,
	})}
	style="animation-delay: {index * 300}ms"
	{...restProps}
>
	{narrativeNodeChoice.title}
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
