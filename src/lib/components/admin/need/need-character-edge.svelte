<script lang="ts">
	import { getBezierPath, BaseEdge, EdgeLabel, useEdges } from '@xyflow/svelte';
	import type { Position } from '@xyflow/svelte';
	import type { CharacterNeed } from '$lib/types';

	interface Props {
		id: string;
		sourceX: number;
		sourceY: number;
		sourcePosition: Position;
		targetX: number;
		targetY: number;
		targetPosition: Position;
		data?: { characterNeed: CharacterNeed };
		style?: string;
	}

	let {
		id,
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
		data,
		style,
	}: Props = $props();

	const edges = useEdges();

	const [edgePath, labelX, labelY] = $derived(
		getBezierPath({
			sourceX,
			sourceY,
			sourcePosition,
			targetX,
			targetY,
			targetPosition,
		})
	);
</script>

<BaseEdge path={edgePath} {style} />
{#if data?.characterNeed}
	<EdgeLabel x={labelX} y={labelY}>
		<div class="rounded-full bg-blue-500 p-1 px-2 text-[10px] text-white">
			{data.characterNeed.decay_multiplier}배
		</div>
	</EdgeLabel>
{/if}
