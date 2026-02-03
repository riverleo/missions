<script lang="ts">
	import { useNarrative } from '$lib/hooks';
	import NarrativeNodePlayContent from './narrative-node-play-content.svelte';
	import NarrativeNodePlayDiceRoll from './narrative-node-play-dice-roll.svelte';

	const { play } = useNarrative();
	const playStore = play.store;
</script>

{#if $playStore.narrativeNode}
	<NarrativeNodePlayContent />
{/if}

{#if $playStore.narrativeDiceRoll && $playStore.narrativeDiceRoll.difficulty_class > 0}
	<NarrativeNodePlayDiceRoll />
{/if}
