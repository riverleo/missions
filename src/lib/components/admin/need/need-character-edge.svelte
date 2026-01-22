<script lang="ts">
	import { getBezierPath, BaseEdge, EdgeLabel, useEdges } from '@xyflow/svelte';
	import type { Position } from '@xyflow/svelte';
	import type { CharacterNeed } from '$lib/types';
	import { useCharacter } from '$lib/hooks/use-character';

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
	const { needStore } = useCharacter();

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
		if (!data?.characterNeed) return 0;
		const need = $needStore.data[data.characterNeed.need_id];
		if (!need) return 0;
		return need.decrease_per_tick * data.characterNeed.decay_multiplier;
	});
</script>

<BaseEdge path={edgePath} {style} />
{#if data?.characterNeed}
	<EdgeLabel x={labelX} y={labelY}>
		<div class="rounded-full bg-blue-500 p-1 px-2 text-[10px] text-white">
			{parseFloat(calculatedDecrease().toFixed(2))} / 틱당 감소
		</div>
	</EdgeLabel>
{/if}
