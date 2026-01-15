<script lang="ts">
	import { useWorldContext } from '$lib/hooks/use-world';
	import { CELL_SIZE } from '$lib/constants';
	import { vectorUtils } from '$lib/utils/vector';

	const world = useWorldContext();
	const { pathfinder } = world;

	// grid를 순회하며 walkable/jumpable/unwalkable 셀 수집
	const walkableCells = $derived.by(() => {
		world.initialized; // 초기화 상태 변경 감지
		const cells: Array<{ col: number; row: number }> = [];
		for (let row = 0; row < pathfinder.rows; row++) {
			for (let col = 0; col < pathfinder.cols; col++) {
				if (pathfinder.grid.isWalkableAt(col, row)) {
					cells.push({ col, row });
				}
			}
		}
		return cells;
	});

	const jumpableCells = $derived.by(() => {
		world.initialized; // 초기화 상태 변경 감지
		const cells: Array<{ col: number; row: number }> = [];
		for (const cellKey of pathfinder.jumpableCells) {
			const [colStr, rowStr] = cellKey.split(',');
			cells.push({ col: parseInt(colStr!, 10), row: parseInt(rowStr!, 10) });
		}
		return cells;
	});

	const unwalkableCells = $derived.by(() => {
		world.initialized; // 초기화 상태 변경 감지
		const cells: Array<{ col: number; row: number }> = [];
		for (let row = 0; row < pathfinder.rows; row++) {
			for (let col = 0; col < pathfinder.cols; col++) {
				const cellKey = vectorUtils.createCellKey(col, row);
				const isWalkable = pathfinder.grid.isWalkableAt(col, row);
				const isJumpable = pathfinder.isJumpable(cellKey);
				if (!isWalkable && !isJumpable) {
					cells.push({ col, row });
				}
			}
		}
		return cells;
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
