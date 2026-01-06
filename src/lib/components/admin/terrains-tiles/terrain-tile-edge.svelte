<script lang="ts">
	import { getBezierPath, BaseEdge, EdgeLabel } from '@xyflow/svelte';
	import type { Position } from '@xyflow/svelte';
	import type { TerrainTile } from '$lib/types';

	interface Props {
		id: string;
		sourceX: number;
		sourceY: number;
		sourcePosition: Position;
		targetX: number;
		targetY: number;
		targetPosition: Position;
		data?: { terrainTile: TerrainTile };
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

	const label = $derived(() => {
		if (!data?.terrainTile) return '';
		const { spawn_weight, min_cluster_size, max_cluster_size } = data.terrainTile;
		return `${spawn_weight} (${min_cluster_size}~${max_cluster_size}개)`;
	});
</script>

<BaseEdge path={edgePath} {style} />
{#if data?.terrainTile}
	<EdgeLabel x={labelX} y={labelY}>
		<div class="rounded-full bg-neutral-700 p-1 px-2 text-[8px] text-white">
			{label()}
		</div>
	</EdgeLabel>
{/if}
