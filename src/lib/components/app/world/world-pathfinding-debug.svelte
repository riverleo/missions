<script lang="ts">
	import { useWorldContext } from '$lib/hooks/use-world';
	import type { Vector } from '$lib/utils/vector';

	const world = useWorldContext();
	const { pathfinder } = world;

	// pathfinder grid의 unwalkable 셀들을 $derived로 계산
	const unwalkableCells = $derived.by(() => {
		const cells: Vector[] = [];
		for (let row = 0; row < pathfinder.rows; row++) {
			for (let col = 0; col < pathfinder.cols; col++) {
				if (!pathfinder.isWalkable(col, row)) {
					cells.push({ x: col, y: row });
				}
			}
		}
		return cells;
	});
</script>

{#if world.debug}
	<!-- Unwalkable 셀 하이라이트 -->
	{#each unwalkableCells as cell (cell.x + ',' + cell.y)}
		<div
			class="absolute border border-red-500/10 bg-red-500/10"
			style="
				top: {cell.y * pathfinder.size}px;
				left: {cell.x * pathfinder.size}px;
				width: {pathfinder.size}px;
				height: {pathfinder.size}px;
			"
		></div>
	{/each}
{/if}
