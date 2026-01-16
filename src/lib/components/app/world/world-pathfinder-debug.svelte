<script lang="ts">
	import { useWorldContext } from '$lib/hooks/use-world';
	import { CELL_SIZE } from '$lib/constants';

	const world = useWorldContext();
	const { pathfinder } = world;

	let walkables = $state<Array<{ col: number; row: number }>>([]);
	let jumpables = $state<Array<{ col: number; row: number }>>([]);

	// pathfinder 업데이트 시 walkable/jumpable 셀만 재계산
	$effect(() => {
		world.pathfinderUpdated;

		// walkable 셀 수집
		const walkable: Array<{ col: number; row: number }> = [];
		for (let row = 0; row < pathfinder.rows; row++) {
			for (let col = 0; col < pathfinder.cols; col++) {
				if (pathfinder.grid.isWalkableAt(col, row)) {
					walkable.push({ col, row });
				}
			}
		}
		walkables = walkable;

		// jumpable 셀 수집
		const jumpable: Array<{ col: number; row: number }> = [];
		for (const cellKey of pathfinder.jumpables) {
			const [colStr, rowStr] = cellKey.split(',');
			jumpable.push({ col: parseInt(colStr!, 10), row: parseInt(rowStr!, 10) });
		}
		jumpables = jumpable;
	});
</script>

{#if world.debug}
	<!-- Walkable 셀 하이라이트 -->
	{#each walkables as cell (cell.col + ',' + cell.row)}
		<div
			class="absolute border border-green-500/10 bg-green-500/5"
			style="
				top: {cell.row * CELL_SIZE}px;
				left: {cell.col * CELL_SIZE}px;
				width: {CELL_SIZE}px;
				height: {CELL_SIZE}px;
			"
		></div>
	{/each}

	<!-- Jump Zone 셀 하이라이트 -->
	{#each jumpables as cell (cell.col + ',' + cell.row)}
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
