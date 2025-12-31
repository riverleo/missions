<script lang="ts">
	import { TILE_SIZE, PLANNING_TILE_FILL_STYLE } from './constants';
	import { useWorldContext } from '$lib/hooks/use-world';
	import { pixelToTile } from './tiles';

	interface Props {
		cols: number;
		rows: number;
	}

	let { cols, rows }: Props = $props();

	const world = useWorldContext();

	const width = $derived(cols * TILE_SIZE);
	const height = $derived(rows * TILE_SIZE);

	// 겹치는 셀들을 Set으로 변환 (빠른 조회용)
	const overlappingCellSet = $derived(() => {
		const cells = world.planning.getOverlappingCells();
		return new Set(cells.map((c) => `${c.col},${c.row}`));
	});

	// 셀이 겹치는지 확인 (절대 좌표 기준)
	function isCellOverlapping(localCol: number, localRow: number): boolean {
		if (!world.planning.placement) return false;

		const { x, y } = world.planning.placement;
		// 건물 중심 기준 좌상단 타일 인덱스
		const startCol = pixelToTile(x) - Math.floor(cols / 2);
		const startRow = pixelToTile(y) - Math.floor(rows / 2);

		const absoluteCol = startCol + localCol;
		const absoluteRow = startRow + localRow;

		return overlappingCellSet().has(`${absoluteCol},${absoluteRow}`);
	}

	const OVERLAP_TILE_FILL_STYLE = 'rgba(239, 68, 68, 0.8)';
</script>

<svg class="pointer-events-none overflow-visible" {width} {height}>
	{#each Array(rows) as _, row}
		{#each Array(cols) as _, col}
			{@const isOverlapping = isCellOverlapping(col, row)}
			<rect
				x={col * TILE_SIZE + 0.5}
				y={row * TILE_SIZE + 0.5}
				width={TILE_SIZE - 1}
				height={TILE_SIZE - 1}
				fill={isOverlapping ? OVERLAP_TILE_FILL_STYLE : PLANNING_TILE_FILL_STYLE}
			/>
		{/each}
	{/each}
</svg>
