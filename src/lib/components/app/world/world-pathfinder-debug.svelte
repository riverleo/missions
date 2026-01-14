<script lang="ts">
	import { useWorldContext } from '$lib/hooks/use-world';
	import type { Vector, PathfinderCell } from '$lib/types/vector';
	import { CELL_SIZE } from '$lib/constants';

	const world = useWorldContext();
	const { pathfinder } = world;

	// pathfinder의 cells Record를 사용하여 walkable/unwalkable/jumpable 셀 필터링
	const walkableCells = $derived.by(() => {
		world.initialized; // 초기화 상태 변경 감지
		return Object.values(pathfinder.cells).filter((cell) => {
			return (
				cell && typeof cell === 'object' && 'walkable' in cell && (cell as any).walkable === true
			);
		}) as PathfinderCell[];
	});

	const jumpableCells = $derived.by(() => {
		world.initialized; // 초기화 상태 변경 감지
		return Object.values(pathfinder.cells).filter((cell) => {
			return (
				cell && typeof cell === 'object' && 'jumpable' in cell && (cell as any).jumpable === true
			);
		}) as PathfinderCell[];
	});

	const unwalkableCells = $derived.by(() => {
		world.initialized; // 초기화 상태 변경 감지
		return Object.values(pathfinder.cells).filter((cell) => {
			return (
				cell &&
				typeof cell === 'object' &&
				(cell as any).walkable !== true &&
				(cell as any).jumpable !== true
			);
		}) as PathfinderCell[];
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
