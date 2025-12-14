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

	const isSelected = $derived($playStore.selectedNarrativeNodeChoiceId === narrativeNodeChoice.id);
</script>

<button
	data-shortcut-key={isSelected ? 'Space Enter' : undefined}
	data-shortcut-effect="bounce"
	data-shortcut-layer={layerId}
	onclick={() => play.select(narrativeNodeChoice)}
	class={cn('text-2xl blur-3xl', {
		'opacity-20': !isSelected,
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
