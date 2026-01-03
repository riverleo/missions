<script lang="ts">
	import { useWorldContext } from '$lib/hooks/use-world';
	import { useBuilding } from '$lib/hooks/use-building';
	import BuildingSpriteAnimator from '$lib/components/app/sprite-animator/building-sprite-animator.svelte';
	import { TILE_SIZE, PLANNING_TILE_FILL_STYLE } from './constants';

	const world = useWorldContext();
	const { store: buildingStore } = useBuilding();

	// 배치할 건물
	const placementBuildingId = $derived(world.blueprint.cursor?.buildingId);
	const placementBuilding = $derived(
		placementBuildingId ? $buildingStore.data[placementBuildingId] : undefined
	);

	// 건물 타일 크기
	const cols = $derived(placementBuilding?.tile_cols ?? 0);
	const rows = $derived(placementBuilding?.tile_rows ?? 0);
	const width = $derived(cols * TILE_SIZE);
	const height = $derived(rows * TILE_SIZE);

	// 좌상단 타일 인덱스를 건물 중심 픽셀 좌표로 변환
	const centerX = $derived(() => {
		if (!world.blueprint.cursor || !placementBuilding) return 0;
		const { tileX } = world.blueprint.cursor;
		const width = placementBuilding.tile_cols * TILE_SIZE;
		return tileX * TILE_SIZE + width / 2;
	});

	const centerY = $derived(() => {
		if (!world.blueprint.cursor || !placementBuilding) return 0;
		const { tileY } = world.blueprint.cursor;
		const height = placementBuilding.tile_rows * TILE_SIZE;
		return tileY * TILE_SIZE + height / 2;
	});

	// 겹치는 셀들을 Set으로 변환 (빠른 조회용)
	const overlappingCellSet = $derived(() => {
		const cells = world.blueprint.getOverlappingCells();
		return new Set(cells.map((c) => `${c.col},${c.row}`));
	});

	// 셀이 겹치는지 확인 (절대 좌표 기준)
	function isCellOverlapping(localCol: number, localRow: number): boolean {
		if (!world.blueprint.cursor) return false;

		const { tileX, tileY } = world.blueprint.cursor;
		const absoluteCol = tileX + localCol;
		const absoluteRow = tileY + localRow;

		return overlappingCellSet().has(`${absoluteCol},${absoluteRow}`);
	}

	const OVERLAP_TILE_FILL_STYLE = 'rgba(239, 68, 68, 0.8)';
</script>

{#if world.blueprint.cursor}
	{@const x = centerX()}
	{@const y = centerY()}
	<!-- 배치 셀 하이라이트 -->
	<div
		class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {x}px; top: {y}px;"
	>
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
	</div>

	<!-- 건물 스프라이트 미리보기 -->
	{#if placementBuilding}
		<div
			class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 opacity-50"
			style="left: {x}px; top: {y}px;"
		>
			<BuildingSpriteAnimator buildingId={placementBuilding.id} stateType="idle" resolution={2} />
		</div>
	{/if}
{/if}
