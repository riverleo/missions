<script lang="ts">
	import { useWorldContext } from '$lib/hooks/use-world';
	import type { Vector } from '$lib/utils/vector';
	import type { PathfinderCell } from '$lib/types/pathfinder';

	const world = useWorldContext();
	const { pathfinder } = world;

	// pathfinder의 cells Record를 사용하여 walkable/unwalkable/jumpable 셀 필터링
	const walkableCells = $derived.by(() => {
		world.initialized; // 초기화 상태 변경 감지
		return Object.values(pathfinder.cells).filter((cell: PathfinderCell) => cell.walkable);
	});

	const jumpableCells = $derived.by(() => {
		world.initialized; // 초기화 상태 변경 감지
		return Object.values(pathfinder.cells).filter((cell: PathfinderCell) => cell.jumpable);
	});

	const unwalkableCells = $derived.by(() => {
		world.initialized; // 초기화 상태 변경 감지
		return Object.values(pathfinder.cells).filter(
			(cell: PathfinderCell) => !cell.walkable && !cell.jumpable
		);
	});
</script>

{#if world.debug}
	<!-- Walkable 셀 하이라이트 -->
	{#each walkableCells as cell (cell.col + ',' + cell.row)}
		<div
			class="absolute border border-green-500/10 bg-green-500/5"
			style="
				top: {cell.row * pathfinder.size}px;
				left: {cell.col * pathfinder.size}px;
				width: {pathfinder.size}px;
				height: {pathfinder.size}px;
			"
		></div>
	{/each}

	<!-- Jump Zone 셀 하이라이트 -->
	{#each jumpableCells as cell (cell.col + ',' + cell.row)}
		<div
			class="absolute border border-yellow-500/30 bg-yellow-500/20"
			style="
				top: {cell.row * pathfinder.size}px;
				left: {cell.col * pathfinder.size}px;
				width: {pathfinder.size}px;
				height: {pathfinder.size}px;
			"
		></div>
	{/each}

	<!-- Unwalkable 셀 하이라이트 -->
	{#each unwalkableCells as cell (cell.col + ',' + cell.row)}
		<div
			class="absolute border border-red-500/20 bg-red-500/10"
			style="
				top: {cell.row * pathfinder.size}px;
				left: {cell.col * pathfinder.size}px;
				width: {pathfinder.size}px;
				height: {pathfinder.size}px;
			"
		></div>
	{/each}
{/if}
