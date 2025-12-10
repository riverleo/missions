<script lang="ts">
	import '@xyflow/svelte/dist/style.css';
	import { SvelteFlow, Controls, Background, BackgroundVariant, MiniMap } from '@xyflow/svelte';
	import type { Node, Edge } from '@xyflow/svelte';
	import { mode } from 'mode-watcher';
	import { page } from '$app/state';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import NarrativeNode from './narrative-node.svelte';
	import DiceRollNode from './dice-roll-node.svelte';

	const narrativeId = $derived(page.params.narrativeId);
	const { narratives } = useNarrative();

	const currentNarrative = $derived($narratives.data?.find((n) => n.id === narrativeId));
	const narrativeNodes = $derived(currentNarrative?.narrative_nodes ?? []);

	const nodeTypes = {
		narrativeNode: NarrativeNode,
		diceRoll: DiceRollNode,
	};

	let nodes = $state<Node[]>([]);
	let edges = $state<Edge[]>([]);

	function convertToNodesAndEdges() {
		const newNodes: Node[] = [];
		const newEdges: Edge[] = [];

		narrativeNodes.forEach((narrativeNode, index) => {
			// 1. narrative_node 노드 생성
			newNodes.push({
				id: narrativeNode.id,
				type: 'narrativeNode',
				data: { narrativeNode },
				position: { x: index * 300, y: 100 },
				deletable: true,
			});

			// 2. dice_roll 노드 생성
			const diceRollId = `dice-roll-${narrativeNode.dice_roll.id}`;
			newNodes.push({
				id: diceRollId,
				type: 'diceRoll',
				data: { diceRoll: narrativeNode.dice_roll },
				position: { x: index * 300 + 250, y: 100 },
				deletable: true,
			});

			// 3. narrative_node → dice_roll 엣지
			newEdges.push({
				id: `${narrativeNode.id}-${diceRollId}`,
				source: narrativeNode.id,
				target: diceRollId,
				deletable: true,
			});

			// 4. dice_roll → success/failure 노드 엣지
			if (narrativeNode.dice_roll.success_narrative_node_id) {
				newEdges.push({
					id: `${diceRollId}-success-${narrativeNode.dice_roll.success_narrative_node_id}`,
					source: diceRollId,
					sourceHandle: 'success',
					target: narrativeNode.dice_roll.success_narrative_node_id,
					deletable: true,
					style: 'stroke: #22c55e',
				});
			}

			if (narrativeNode.dice_roll.failure_narrative_node_id) {
				newEdges.push({
					id: `${diceRollId}-failure-${narrativeNode.dice_roll.failure_narrative_node_id}`,
					source: diceRollId,
					sourceHandle: 'failure',
					target: narrativeNode.dice_roll.failure_narrative_node_id,
					deletable: true,
					style: 'stroke: #ef4444',
				});
			}
		});

		nodes = newNodes;
		edges = newEdges;
	}

	$effect(() => {
		convertToNodesAndEdges();
	});
</script>

<div class="relative flex-1">
	{#if narrativeId}
		<SvelteFlow {nodes} {edges} {nodeTypes} colorMode={mode.current} fitView>
			<Controls />
			<Background variant={BackgroundVariant.Dots} />
			<MiniMap />
		</SvelteFlow>
	{/if}
</div>
