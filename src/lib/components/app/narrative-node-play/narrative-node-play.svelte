<script lang="ts">
	import { useNarrative } from '$lib/hooks/use-narrative';
	import NarrativeNodePlayText from './narrative-node-play-text.svelte';
	import NarrativeNodePlayChoice from './narrative-node-play-choice.svelte';
	import NarrativeNodePlayDiceRoll from './narrative-node-play-dice-roll.svelte';
	import { activateStack, type StackId } from '$lib/shortcut/store';

	const stackId: StackId = 'narrative';

	const { play } = useNarrative();
	const playStore = play.store;

	$effect(() => {
		if ($playStore.narrativeNode === undefined) return;

		return activateStack(stackId);
	});
</script>

<div
	class="fixed top-0 right-0 bottom-0 left-0 z-0 min-h-lvh items-center justify-center bg-black/10 backdrop-blur-sm"
	class:invisible={$playStore.narrativeNode === undefined}
	data-shortcut-stack={stackId}
>
	<!-- TODO: 임시 닫기 버튼 -->
	<button class="absolute top-4 right-4 text-2xl text-white" onclick={() => play.done()}>✕</button>

	<div class="absolute top-1/2 left-1/2 -translate-1/2">
		{#if $playStore.narrativeNode?.type === 'text'}
			<NarrativeNodePlayText />
		{:else if $playStore.narrativeNode?.type === 'choice'}
			<NarrativeNodePlayChoice />
		{/if}
	</div>

	<NarrativeNodePlayDiceRoll />
</div>
