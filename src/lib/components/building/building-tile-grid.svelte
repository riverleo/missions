<script lang="ts">
	import { CELL_SIZE } from '$lib/constants';

	interface Props {
		cols: number;
		rows: number;
	}

	let { cols, rows }: Props = $props();

	const width = $derived(cols * CELL_SIZE);
	const height = $derived(rows * CELL_SIZE);
</script>

<svg class="overflow-visible" {width} {height}>
	{#each Array(rows) as _, row}
		{#each Array(cols) as _, col}
			<rect
				x={col * CELL_SIZE + 0.5}
				y={row * CELL_SIZE + 0.5}
				width={CELL_SIZE - 1}
				height={CELL_SIZE - 1}
				fill="rgba(34, 197, 94, 0.8)"
			/>
		{/each}
	{/each}
</svg>
