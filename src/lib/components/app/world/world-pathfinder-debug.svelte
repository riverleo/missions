<script lang="ts">
	import { useWorldContext } from '$lib/hooks/use-world';
	import { CELL_SIZE } from '$lib/constants';
	import { vectorUtils } from '$lib/utils/vector';

	const world = useWorldContext();
	const { pathfinder } = world;

	let walkableCells = $state<Array<{ col: number; row: number }>>([]);
	let jumpableCells = $state<Array<{ col: number; row: number }>>([]);
	let unwalkableCells = $state<Array<{ col: number; row: number }>>([]);

	// pathfinder 업데이트 시 모든 셀 재계산
	$effect(() => {
		console.log('pathfinderUpdated:', world.pathfinderUpdated);

		// walkable 셀 수집
		const walkable: Array<{ col: number; row: number }> = [];
		for (let row = 0; row < pathfinder.rows; row++) {
			for (let col = 0; col < pathfinder.cols; col++) {
				if (pathfinder.grid.isWalkableAt(col, row)) {
					walkable.push({ col, row });
				}
			}
		}
		console.log('walkable cells:', walkable.length);
		walkableCells = walkable;

		// jumpable 셀 수집
		const jumpable: Array<{ col: number; row: number }> = [];
		for (const cellKey of pathfinder.jumpableCells) {
			const [colStr, rowStr] = cellKey.split(',');
			jumpable.push({ col: parseInt(colStr!, 10), row: parseInt(rowStr!, 10) });
		}
		jumpableCells = jumpable;

		// unwalkable 셀 수집
		const unwalkable: Array<{ col: number; row: number }> = [];
		for (let row = 0; row < pathfinder.rows; row++) {
			for (let col = 0; col < pathfinder.cols; col++) {
				const cellKey = vectorUtils.createCellKey(col, row);
				const isWalkable = pathfinder.grid.isWalkableAt(col, row);
				const isJumpable = pathfinder.isJumpable(cellKey);
				if (!isWalkable && !isJumpable) {
					unwalkable.push({ col, row });
				}
			}
		}
		unwalkableCells = unwalkable;
	});
</script>

{#if world.debug}
	<!-- Walkable 셀 하이라이트 -->
	{#each walkableCells as cell (cell.col + ',' + cell.row)}
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
	{#each jumpableCells as cell (cell.col + ',' + cell.row)}
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

	<!-- Unwalkable 셀 하이라이트 -->
	{#each unwalkableCells as cell (cell.col + ',' + cell.row)}
		<div
			class="absolute border border-red-500/20 bg-red-500/10"
			style="
				top: {cell.row * CELL_SIZE}px;
				left: {cell.col * CELL_SIZE}px;
				width: {CELL_SIZE}px;
				height: {CELL_SIZE}px;
			"
		></div>
	{/each}
{/if}
