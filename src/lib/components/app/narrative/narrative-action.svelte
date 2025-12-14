<script lang="ts">
	import { useNarrative } from '$lib/hooks/use-narrative';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Kbd } from '$lib/components/ui/kbd';
	import NarrativeChoice from './narrative-choice.svelte';
	import type { LayerId } from '$lib/shortcut/store';

	const layerId: LayerId = 'narrative';

	const { narrativeNodeStore, narrativeNodeChoiceStore, narrativeDiceRollStore, play } = useNarrative();
	const playStore = play.store;

	const narrativeNode = $derived(
		$playStore.narrativeNodeId
			? $narrativeNodeStore.data?.[$playStore.narrativeNodeId]
			: undefined
	);

	const narrativeNodeChoices = $derived(
		narrativeNode
			? Object.values($narrativeNodeChoiceStore.data ?? {}).filter(
					(c) => c.narrative_node_id === narrativeNode.id
				)
			: []
	);

	const narrativeDiceRoll = $derived(
		$playStore.narrativeDiceRollId
			? $narrativeDiceRollStore.data?.[$playStore.narrativeDiceRollId]
			: undefined
	);
</script>

{#if narrativeNode?.type === 'choice'}
	<div class="flex flex-col items-center gap-3 px-8">
		{#each narrativeNodeChoices as narrativeNodeChoice, index (narrativeNodeChoice.id)}
			<NarrativeChoice {narrativeNodeChoice} {index} />
		{/each}
	</div>
{:else if narrativeNode?.type === 'text'}
	<div class="flex flex-col items-center gap-8 px-8">
		<Button
			variant="ghost"
			data-shortcut-key="Space Enter"
			data-shortcut-effect="bounce"
			data-shortcut-layer={layerId}
			onclick={() => play.roll()}
		>
			{#if narrativeDiceRoll && narrativeDiceRoll.difficulty_class > 0}
				주사위 굴리기
			{:else}
				다음
			{/if}
			<Kbd>Space</Kbd>
		</Button>
	</div>
{/if}
