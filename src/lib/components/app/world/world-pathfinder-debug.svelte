<script lang="ts">
	import { useWorldContext } from '$lib/hooks/use-world';
	import { CELL_SIZE } from '$lib/constants';
	import { vectorUtils } from '$lib/utils/vector';

	const world = useWorldContext();
	const { pathfinder } = world;

	let walkables = $state<Array<{ col: number; row: number }>>([]);
	let jumpables = $state<Array<{ col: number; row: number }>>([]);

	// pathfinder 업데이트 시 walkable/jumpable 셀만 재계산 (디버그 모드일 때만)
	$effect(() => {
		if (!world.debug) return;

		world.pathfinderUpdated;
		// walkable 셀 수집
		walkables = Array.from(pathfinder.walkables).map((cellKey) => vectorUtils.createCell(cellKey));

		// jumpable 셀 수집
		jumpables = Array.from(pathfinder.jumpables).map((cellKey) => vectorUtils.createCell(cellKey));
	});
</script>

{#if world.debug}
	<!-- Walkable 영역 하이라이트 -->
	{#each walkables as cell (vectorUtils.createCellKey(cell.col, cell.row))}
		<div
			class="absolute border border-green-500/30 bg-green-500/10"
			style="
				top: {cell.row * CELL_SIZE}px;
				left: {cell.col * CELL_SIZE}px;
				width: {CELL_SIZE}px;
				height: {CELL_SIZE}px;
			"
		></div>
	{/each}

	<!-- Jump Zone 셀 하이라이트 -->
	{#each jumpables as cell (vectorUtils.createCellKey(cell.col, cell.row))}
		<div
			class="absolute border border-yellow-500/30 bg-yellow-500/20"
			style="
				top: {cell.row * CELL_SIZE}px;
				left: {cell.col * CELL_SIZE}px;
				width: {CELL_SIZE}px;
				height: {CELL_SIZE}px;
			"
		></div>
	{/each}
{/if}
