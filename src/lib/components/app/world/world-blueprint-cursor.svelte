<script lang="ts">
	import { useWorldContext } from '$lib/hooks/use-world';
	import { useBuilding } from '$lib/hooks/use-building';
	import { EntityIdUtils } from '$lib/utils/entity-id';
	import BuildingSpriteAnimator from '$lib/components/app/sprite-animator/building-sprite-animator.svelte';
	import { EntityTemplateSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { CELL_SIZE, TILE_SIZE } from '$lib/constants';
	import type { BuildingId, TileId } from '$lib/types';
	import TileSpriteAnimator from '../sprite-animator/tile-sprite-animator.svelte';

	const world = useWorldContext();
	const { store: buildingStore } = useBuilding();

	const entityTemplateId = $derived(world.blueprint.cursor?.entityTemplateId);

	const building = $derived.by(() => {
		if (!entityTemplateId || !EntityIdUtils.template.is('building', entityTemplateId))
			return undefined;
		const { value: buildingId } = EntityIdUtils.template.parse<BuildingId>(entityTemplateId);
		return $buildingStore.data[buildingId];
	});

	const tileId = $derived.by(() => {
		if (!entityTemplateId || !EntityIdUtils.template.is('tile', entityTemplateId)) return undefined;
		const { value } = EntityIdUtils.template.parse<TileId>(entityTemplateId);
		return value;
	});

	const isTile = $derived(entityTemplateId && EntityIdUtils.template.is('tile', entityTemplateId));
	const isCharacter = $derived(
		entityTemplateId && EntityIdUtils.template.is('character', entityTemplateId)
	);
	const isItem = $derived(entityTemplateId && EntityIdUtils.template.is('item', entityTemplateId));

	// gridType에 따라 크기 단위 결정
	const gridSize = $derived(world.blueprint.gridType === 'tile' ? TILE_SIZE : CELL_SIZE);

	const cols = $derived(building?.cell_cols ?? (isTile || isCharacter || isItem ? 1 : 0));
	const rows = $derived(building?.cell_rows ?? (isTile || isCharacter || isItem ? 1 : 0));
	const width = $derived(cols * gridSize);
	const height = $derived(rows * gridSize);

	const centerX = $derived.by(() => {
		if (!world.blueprint.cursor) return 0;
		const { x } = world.blueprint.cursor;
		const size = world.blueprint.gridType === 'tile' ? TILE_SIZE : CELL_SIZE;
		const tileCols = building?.cell_cols ?? (isTile || isCharacter || isItem ? 1 : 0);
		const width = tileCols * size;
		return x * size + width / 2;
	});

	const centerY = $derived.by(() => {
		if (!world.blueprint.cursor) return 0;
		const { y } = world.blueprint.cursor;
		const size = world.blueprint.gridType === 'tile' ? TILE_SIZE : CELL_SIZE;
		const tileRows = building?.cell_rows ?? (isTile || isCharacter || isItem ? 1 : 0);
		const height = tileRows * size;
		return y * size + height / 2;
	});

	// 겹치는 셀들을 Set으로 변환 (빠른 조회용)
	const overlappingCellSet = $derived(() => {
		const cells = world.blueprint.getOverlappingVectors();
		return new Set(cells.map((c) => `${c.x},${c.y}`));
	});

	// 셀이 겹치는지 확인 (절대 좌표 기준)
	function isCellOverlapping(localCol: number, localRow: number): boolean {
		if (!world.blueprint.cursor) return false;

		const { x, y } = world.blueprint.cursor;

		// 타일인 경우 타일 좌표를 셀 좌표로 변환
		if (world.blueprint.gridType === 'tile') {
			const cellX = x * 2;
			const cellY = y * 2;
			// 타일은 2x2 셀을 차지하므로 각 셀을 체크
			for (let dy = 0; dy < 2; dy++) {
				for (let dx = 0; dx < 2; dx++) {
					if (overlappingCellSet().has(`${cellX + dx},${cellY + dy}`)) {
						return true;
					}
				}
			}
			return false;
		}

		// 셀인 경우 그대로 사용
		const absoluteCol = x + localCol;
		const absoluteRow = y + localRow;

		return overlappingCellSet().has(`${absoluteCol},${absoluteRow}`);
	}

	const OVERLAP_TILE_FILL_STYLE = 'rgba(239, 68, 68, 0.8)';
	const PLANNING_TILE_FILL_STYLE = 'rgba(255, 255, 255, 0.8)';
</script>

{#if world.blueprint.cursor}
	{#if building || isTile}
		<!-- 배치 셀 하이라이트 (건물/타일만) -->
		<div
			class="absolute -translate-x-1/2 -translate-y-1/2"
			style="left: {centerX}px; top: {centerY}px;"
		>
			<svg class="overflow-visible" {width} {height}>
				{#each Array(rows) as _, row}
					{#each Array(cols) as _, col}
						{@const isOverlapping = isCellOverlapping(col, row)}
						<rect
							x={col * gridSize + 0.5}
							y={row * gridSize + 0.5}
							width={gridSize - 1}
							height={gridSize - 1}
							fill={isOverlapping ? OVERLAP_TILE_FILL_STYLE : PLANNING_TILE_FILL_STYLE}
						/>
					{/each}
				{/each}
			</svg>
		</div>
	{/if}

	<!-- 스프라이트 미리보기 -->
	{#if building}
		<BuildingSpriteAnimator
			class="absolute -translate-x-1/2 -translate-y-1/2 opacity-50"
			style="left: {centerX + building.collider_offset_x}px; top: {centerY +
				building.collider_offset_y}px;"
			buildingId={building.id}
			stateType="idle"
			resolution={2}
		/>
	{:else if isTile && tileId}
		<TileSpriteAnimator
			class="absolute -translate-x-1/2 -translate-y-1/2 opacity-50"
			style="left: {centerX}px; top: {centerY}px;"
			{tileId}
			stateType="idle"
			index={1}
		/>
	{:else if isCharacter || isItem}
		<EntityTemplateSpriteAnimator
			class="absolute -translate-x-1/2 -translate-y-1/2 opacity-50"
			style="left: {centerX}px; top: {centerY}px;"
			entityTemplateId={entityTemplateId!}
			resolution={2}
		/>
	{/if}
{/if}
