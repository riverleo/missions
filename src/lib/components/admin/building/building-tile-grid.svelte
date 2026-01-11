<script lang="ts">
	import { TILE_SIZE, PLANNING_TILE_FILL_STYLE } from '$lib/constants';

	interface Props {
		cols: number;
		rows: number;
	}

	let { cols, rows }: Props = $props();

	const width = $derived(cols * TILE_SIZE);
	const height = $derived(rows * TILE_SIZE);
</script>

<svg class="overflow-visible" {width} {height}>
	{#each Array(rows) as _, row}
		{#each Array(cols) as _, col}
			<rect
				x={col * TILE_SIZE + 0.5}
				y={row * TILE_SIZE + 0.5}
				width={TILE_SIZE - 1}
				height={TILE_SIZE - 1}
				fill={PLANNING_TILE_FILL_STYLE}
			/>
		{/each}
	{/each}
</svg>
