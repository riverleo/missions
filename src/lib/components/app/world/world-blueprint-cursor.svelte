<script lang="ts">
	import { useWorldContext } from '$lib/hooks/use-world';
	import { useBuilding } from '$lib/hooks/use-building';
	import { EntityIdUtils } from '$lib/utils/entity-id';
	import BuildingSpriteAnimator from '$lib/components/app/sprite-animator/building-sprite-animator.svelte';
	import { EntityTemplateSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { TILE_SIZE, PLANNING_TILE_FILL_STYLE } from './constants';
	import type { BuildingId } from '$lib/types';
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

	const isTile = $derived(entityTemplateId && EntityIdUtils.template.is('tile', entityTemplateId));
	const isCharacter = $derived(
		entityTemplateId && EntityIdUtils.template.is('character', entityTemplateId)
	);
	const isItem = $derived(entityTemplateId && EntityIdUtils.template.is('item', entityTemplateId));

	const cols = $derived(building?.tile_cols ?? (isTile || isCharacter || isItem ? 1 : 0));
	const rows = $derived(building?.tile_rows ?? (isTile || isCharacter || isItem ? 1 : 0));
	const width = $derived(cols * TILE_SIZE);
	const height = $derived(rows * TILE_SIZE);

	const centerX = $derived.by(() => {
		if (!world.blueprint.cursor) return 0;
		const { tileX } = world.blueprint.cursor;
		const tileCols = building?.tile_cols ?? (isTile || isCharacter || isItem ? 1 : 0);
		const width = tileCols * TILE_SIZE;
		return tileX * TILE_SIZE + width / 2;
	});

	const centerY = $derived.by(() => {
		if (!world.blueprint.cursor) return 0;
		const { tileY } = world.blueprint.cursor;
		const tileRows = building?.tile_rows ?? (isTile || isCharacter || isItem ? 1 : 0);
		const height = tileRows * TILE_SIZE;
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
	{:else if isTile}
		<TileSpriteAnimator
			class="absolute -translate-x-1/2 -translate-y-1/2 opacity-50"
			style="left: {centerX}px; top: {centerY}px;"
			tileId={entityTemplateId}
			stateType="idle"
		/>
	{:else if isCharacter || isItem}
		<EntityTemplateSpriteAnimator
			class="absolute -translate-x-1/2 -translate-y-1/2 opacity-50"
			style="left: {centerX}px; top: {centerY}px;"
			{entityTemplateId}
			resolution={2}
		/>
	{/if}
{/if}
