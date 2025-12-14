<script lang="ts">
	import { useNarrative } from '$lib/hooks/use-narrative';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Kbd } from '$lib/components/ui/kbd';
	import NarrativeNodePlayChoice from './narrative-node-play-choice.svelte';
	import type { StackId } from '$lib/shortcut/store';

	const stackId: StackId = 'narrative';

	const { narrativeNodeChoiceStore, play } = useNarrative();
	const playStore = play.store;

	const narrativeNodeChoices = $derived(
		$playStore.narrativeNode
			? Object.values($narrativeNodeChoiceStore.data ?? {}).filter(
					(c) => c.narrative_node_id === $playStore.narrativeNode!.id
				)
			: []
	);
</script>

{#if $playStore.narrativeNode?.type === 'choice'}
	<div class="flex flex-col items-center gap-3 px-8">
		{#each narrativeNodeChoices as narrativeNodeChoice, index (narrativeNodeChoice.id)}
			<NarrativeNodePlayChoice {narrativeNodeChoice} {index} />
		{/each}
	</div>
{:else if $playStore.narrativeNode?.type === 'text'}
	<div class="flex flex-col items-center gap-8 px-8">
		<Button
			variant="ghost"
			data-shortcut-key="Space Enter"
			data-shortcut-effect="bounce"
			data-shortcut-stack={stackId}
			onclick={() => play.roll()}
		>
			{#if $playStore.narrativeDiceRoll && $playStore.narrativeDiceRoll.difficulty_class > 0}
				주사위 굴리기
			{:else}
				다음
			{/if}
			<Kbd>Space</Kbd>
		</Button>
	</div>
{/if}
