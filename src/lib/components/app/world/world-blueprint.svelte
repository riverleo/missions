<script lang="ts">
	import { TILE_SIZE } from './constants';
	import WorldBlueprintCursor from './world-blueprint-cursor.svelte';

	interface Props {
		width: number;
		height: number;
	}

	let { width, height }: Props = $props();

	// 그리드 라인 개수 계산
	const gridCols = $derived(Math.ceil(width / TILE_SIZE));
	const gridRows = $derived(Math.ceil(height / TILE_SIZE));
</script>

<svg class="absolute inset-0 h-full w-full" style="overflow: visible;">
	<!-- 세로 라인 -->
	{#each Array(gridCols + 1) as _, i}
		<line
			x1={i * TILE_SIZE}
			y1={0}
			x2={i * TILE_SIZE}
			y2={gridRows * TILE_SIZE}
			stroke="rgba(255, 255, 255, 0.05)"
			stroke-width="1"
		/>
	{/each}
	<!-- 가로 라인 -->
	{#each Array(gridRows + 1) as _, i}
		<line
			x1={0}
			y1={i * TILE_SIZE}
			x2={gridCols * TILE_SIZE}
			y2={i * TILE_SIZE}
			stroke="rgba(255, 255, 255, 0.05)"
			stroke-width="1"
		/>
	{/each}
</svg>

<WorldBlueprintCursor />
