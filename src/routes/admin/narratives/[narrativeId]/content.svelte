<script lang="ts">
	import '@xyflow/svelte/dist/style.css';
	import { SvelteFlow, Controls, Background, BackgroundVariant, MiniMap } from '@xyflow/svelte';
	import type { Node, Edge } from '@xyflow/svelte';
	import { mode } from 'mode-watcher';
	import { page } from '$app/state';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';

	const narrativeId = $derived(page.params.narrativeId);
	const { narratives } = useNarrative();

	const currentNarrative = $derived($narratives.data?.find((n) => n.id === narrativeId));
	const narrativeNodes = $derived(currentNarrative?.narrative_nodes ?? []);

	let nodes = $state<Node[]>([]);
	let edges = $state<Edge[]>([]);

	// TODO: narrative_nodes를 SvelteFlow nodes/edges로 변환
	$effect(() => {
		console.log('narrativeNodes:', narrativeNodes);
	});
</script>

<div class="relative flex-1">
	{#if narrativeId}
		<SvelteFlow {nodes} {edges} colorMode={mode.current} fitView>
			<Controls />
			<Background variant={BackgroundVariant.Dots} />
			<MiniMap />
		</SvelteFlow>
	{/if}
</div>
