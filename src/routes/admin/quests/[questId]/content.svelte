<script lang="ts">
	import '@xyflow/svelte/dist/style.css';
	import {
		SvelteFlow,
		Controls,
		Background,
		BackgroundVariant,
		MiniMap
	} from '@xyflow/svelte';
	import type { Node, Edge } from '@xyflow/svelte';

	let nodes = $state<Node[]>([
		{
			id: '1',
			type: 'input',
			data: { label: 'Quest Start' },
			position: { x: 250, y: 0 }
		},
		{
			id: '2',
			data: { label: 'Quest Branch 1' },
			position: { x: 100, y: 100 }
		},
		{
			id: '3',
			data: { label: 'Quest Branch 2' },
			position: { x: 400, y: 100 }
		}
	]);

	let edges = $state<Edge[]>([
		{ id: 'e1-2', source: '1', target: '2' },
		{ id: 'e1-3', source: '1', target: '3' }
	]);
</script>

<div class="flex-1">
	<SvelteFlow {nodes} {edges}>
		<Controls />
		<Background variant={BackgroundVariant.Dots} />
		<MiniMap />
	</SvelteFlow>
</div>
