<script lang="ts">
	import { useWorldContext, useWorld } from '$lib/hooks/use-world';
	import type { Vector } from '$lib/utils/vector';

	const world = useWorldContext();
	const { pathfinder } = world;
	const { worldTileMapStore } = useWorld();

	// pathfinder grid의 walkable/unwalkable/jumpZone 셀들을 $derived로 계산
	// worldTileMapStore를 구독하여 타일 추가/제거 시 갱신
	const cells = $derived.by(() => {
		// 초기화 상태 변경 감지 (reload 시 갱신)
		world.initialized;

		// worldTileMapStore의 data 객체 변경 감지
		const tileMapData = $worldTileMapStore.data[world.worldId]?.data;
		// 타일 개수로 변경 감지
		Object.keys(tileMapData ?? {}).length;

		const walkable: Vector[] = [];
		const jumpZone: Vector[] = [];
		const unwalkable: Vector[] = [];

		for (let row = 0; row < pathfinder.rows; row++) {
			for (let col = 0; col < pathfinder.cols; col++) {
				if (pathfinder.grid.isWalkableAt(col, row)) {
					if (pathfinder.isJumpZone({ x: col, y: row })) {
						jumpZone.push({ x: col, y: row });
					} else {
						walkable.push({ x: col, y: row });
					}
				} else {
					unwalkable.push({ x: col, y: row });
				}
			}
		}
		return { walkable, jumpZone, unwalkable };
	});
</script>

{#if world.debug}
	<!-- Walkable 셀 하이라이트 -->
	{#each cells.walkable as cell (cell.x + ',' + cell.y)}
		<div
			class="absolute border border-green-500/10 bg-green-500/5"
			style="
				top: {cell.y * pathfinder.size}px;
				left: {cell.x * pathfinder.size}px;
				width: {pathfinder.size}px;
				height: {pathfinder.size}px;
			"
		></div>
	{/each}

	<!-- Jump Zone 셀 하이라이트 -->
	{#each cells.jumpZone as cell (cell.x + ',' + cell.y)}
		<div
			class="absolute border border-yellow-500/30 bg-yellow-500/20"
			style="
				top: {cell.y * pathfinder.size}px;
				left: {cell.x * pathfinder.size}px;
				width: {pathfinder.size}px;
				height: {pathfinder.size}px;
			"
		></div>
	{/each}

	<!-- Unwalkable 셀 하이라이트 -->
	{#each cells.unwalkable as cell (cell.x + ',' + cell.y)}
		<div
			class="absolute border border-red-500/20 bg-red-500/10"
			style="
				top: {cell.y * pathfinder.size}px;
				left: {cell.x * pathfinder.size}px;
				width: {pathfinder.size}px;
				height: {pathfinder.size}px;
			"
		></div>
	{/each}
{/if}
