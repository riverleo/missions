<script lang="ts">
	import { useNarrative } from '$lib/hooks/use-narrative';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Kbd } from '$lib/components/ui/kbd';
	import NarrativeChoice from './narrative-choice.svelte';
	import type { LayerId } from '$lib/shortcut/store';

	const layerId: LayerId = 'narrative';

	const { play } = useNarrative();
	const playStore = play.store;
</script>

{#if $playStore.narrativeNode?.type === 'choice'}
	<div class="flex flex-col items-center gap-3 px-8">
		{#each $playStore.narrativeNode.narrative_node_choices ?? [] as narrativeNodeChoice, index (narrativeNodeChoice.id)}
			<NarrativeChoice {narrativeNodeChoice} {index} />
		{/each}
	</div>
{:else if $playStore.narrativeNode?.type === 'text'}
	<div class="flex flex-col items-center gap-8 px-8">
		<Button
			variant="ghost"
			data-shortcut-key="Space Enter"
			data-shortcut-effect="bounce"
			data-shortcut-layer={layerId}
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
