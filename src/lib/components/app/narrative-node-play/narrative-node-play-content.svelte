<script lang="ts">
	import { onMount } from 'svelte';
	import { useNarrative } from '$lib/hooks/use-narrative';
	import NarrativeNodePlayText from './narrative-node-play-text.svelte';
	import NarrativeNodePlayChoice from './narrative-node-play-choice.svelte';
	import { activateStack, type StackId } from '$lib/shortcut/store';

	const stackId: StackId = 'narrative';

	const { play } = useNarrative();
	const playStore = play.store;

	onMount(() => activateStack(stackId));
</script>

<div
	class="fixed top-0 right-0 bottom-0 left-0 z-0 min-h-lvh items-center justify-center bg-black/10 backdrop-blur-sm"
	data-shortcut-stack={stackId}
>
	<div class="absolute top-1/2 left-1/2 -translate-1/2">
		{#if $playStore.narrativeNode?.type === 'text'}
			<NarrativeNodePlayText />
		{:else if $playStore.narrativeNode?.type === 'choice'}
			<NarrativeNodePlayChoice />
		{/if}
	</div>
</div>
