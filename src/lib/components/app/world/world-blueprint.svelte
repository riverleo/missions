<script lang="ts">
	import { CELL_SIZE, TILE_SIZE } from '$lib/constants';
	import { useWorldContext, useWorld } from '$lib/hooks/use-world';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import WorldBlueprintCursor from './world-blueprint-cursor.svelte';

	const world = useWorldContext();
	const { worldStore } = useWorld();
	const { store: terrainStore } = useTerrain();

	const terrainId = $derived($worldStore.data[world.worldId]?.terrain_id);
	const terrain = $derived(terrainId ? $terrainStore.data[terrainId] : undefined);

	const width = $derived(terrain?.width ?? 0);
	const height = $derived(terrain?.height ?? 0);

	// 현재 그리드 타입에 따라 그리드 크기 결정
	const gridSize = $derived(world.blueprint.cursor?.type === 'tile' ? TILE_SIZE : CELL_SIZE);

	// 그리드 라인 개수 계산
	const gridCols = $derived(Math.ceil(width / gridSize));
	const gridRows = $derived(Math.ceil(height / gridSize));
</script>

{#if world.blueprint.cursor && terrain}
	<svg class="absolute inset-0 h-full w-full" style="overflow: visible;">
		<!-- 세로 라인 -->
		{#each Array(gridCols + 1) as _, i}
			<line
				x1={i * gridSize}
				y1={0}
				x2={i * gridSize}
				y2={gridRows * gridSize}
				stroke="rgba(255, 255, 255, 0.05)"
				stroke-width="1"
			/>
		{/each}
		<!-- 가로 라인 -->
		{#each Array(gridRows + 1) as _, i}
			<line
				x1={0}
				y1={i * gridSize}
				x2={gridCols * gridSize}
				y2={i * gridSize}
				stroke="rgba(255, 255, 255, 0.05)"
				stroke-width="1"
			/>
		{/each}
	</svg>

	<WorldBlueprintCursor />
{/if}
