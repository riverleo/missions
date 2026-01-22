<script lang="ts">
	import { getBezierPath, BaseEdge, EdgeLabel } from '@xyflow/svelte';
	import type { Position } from '@xyflow/svelte';
	import type { BuildingCondition } from '$lib/types';
	import { useBuilding } from '$lib/hooks/use-building';

	interface Props {
		id: string;
		sourceX: number;
		sourceY: number;
		sourcePosition: Position;
		targetX: number;
		targetY: number;
		targetPosition: Position;
		data?: { buildingCondition: BuildingCondition };
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

	const { conditionStore } = useBuilding();

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

	const calculatedDecrease = $derived(() => {
		if (!data?.buildingCondition) return 0;
		const condition = $conditionStore.data[data.buildingCondition.condition_id];
		if (!condition) return 0;
		return condition.decrease_per_tick * data.buildingCondition.decrease_multiplier;
	});
</script>

<BaseEdge path={edgePath} {style} />
{#if data?.buildingCondition}
	<EdgeLabel x={labelX} y={labelY}>
		<div class="rounded-full bg-blue-500 p-1 px-2 text-[10px] text-white">
			{parseFloat(calculatedDecrease().toFixed(2))} / 틱당 감소{#if data.buildingCondition.disabled_when_depleted},
				사용 X
			{/if}
		</div>
	</EdgeLabel>
{/if}
