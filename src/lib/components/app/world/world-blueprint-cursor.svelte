<script lang="ts">
	import { useWorldContext } from '$lib/hooks/use-world';
	import { useBuilding } from '$lib/hooks/use-building';
	import { EntityIdUtils } from '$lib/utils/entity-id';
	import { vectorUtils } from '$lib/utils/vector';
	import BuildingSpriteAnimator from '$lib/components/app/sprite-animator/building-sprite-animator.svelte';
	import CharacterSpriteAnimator from '$lib/components/app/sprite-animator/character-sprite-animator.svelte';
	import ItemSpriteAnimator from '$lib/components/app/sprite-animator/item-sprite-animator.svelte';
	import QuarterTile from '$lib/components/app/world/tiles/quarter-tile.svelte';
	import { CELL_SIZE, TILE_SIZE } from '$lib/constants';
	import type { BuildingId, CharacterId, ItemId } from '$lib/types';
	import type { TileCell } from '$lib/types/vector';

	const world = useWorldContext();
	const { store: buildingStore } = useBuilding();

	const entityTemplateId = $derived(world.blueprint.cursor?.entityTemplateId);
	const tileCells = $derived(
		Array.from(world.blueprint.cursorTileCellKeys).map((key) => vectorUtils.createTileCell(key))
	);

	const building = $derived.by(() => {
		if (!entityTemplateId || !EntityIdUtils.template.is('building', entityTemplateId))
			return undefined;
		const { value: buildingId } = EntityIdUtils.template.parse<BuildingId>(entityTemplateId);
		return $buildingStore.data[buildingId];
	});

	const isTile = $derived(EntityIdUtils.template.is('tile', entityTemplateId));
	const isCharacter = $derived(EntityIdUtils.template.is('character', entityTemplateId));
	const isItem = $derived(EntityIdUtils.template.is('item', entityTemplateId));

	const characterId = $derived.by(() => {
		if (!entityTemplateId || !EntityIdUtils.template.is('character', entityTemplateId))
			return undefined;
		return EntityIdUtils.template.id<CharacterId>(entityTemplateId);
	});

	const itemId = $derived.by(() => {
		if (!entityTemplateId || !EntityIdUtils.template.is('item', entityTemplateId)) return undefined;
		return EntityIdUtils.template.id<ItemId>(entityTemplateId);
	});

	// gridType에 따라 크기 단위 결정
	const gridSize = $derived(world.blueprint.cursor?.type === 'tile' ? TILE_SIZE : CELL_SIZE);

	const cols = $derived(building?.cell_cols ?? (isTile || isCharacter || isItem ? 1 : 0));
	const rows = $derived(building?.cell_rows ?? (isTile || isCharacter || isItem ? 1 : 0));
	const width = $derived(cols * gridSize);
	const height = $derived(rows * gridSize);

	const centerX = $derived.by(() => {
		if (!world.blueprint.cursor) return 0;
		const { x } = world.blueprint.cursor.current;

		// cursor.current는 이미 픽셀 좌표
		if (isCharacter || isItem) {
			return x + CELL_SIZE / 2;
		}

		// 건물/타일
		const cols = building?.cell_cols ?? 1;
		const width = cols * gridSize;
		return x + width / 2;
	});

	const centerY = $derived.by(() => {
		if (!world.blueprint.cursor) return 0;
		const { y } = world.blueprint.cursor.current;

		// cursor.current는 이미 픽셀 좌표
		if (isCharacter || isItem) {
			return y + CELL_SIZE / 2;
		}

		// 건물/타일
		const rows = building?.cell_rows ?? 1;
		const height = rows * gridSize;
		return y + height / 2;
	});

	const PLANNING_TILE_FILL_STYLE = 'rgba(255, 255, 255, 0.8)';
	const DISABLED_TILE_FILL_STYLE = 'rgba(156, 163, 175, 0.8)'; // gray-400

	const isPlacable = $derived(world.blueprint.placable);

	// 겹치는 기존 셀들을 렌더링하기 위한 배열
	const overlappingExistingCells = $derived(world.blueprint.overlappingCells);
</script>

{#if world.blueprint.cursor}
	{#if building}
		<!-- 배치 셀 하이라이트 (건물만) -->
		<div
			class="absolute -translate-x-1/2 -translate-y-1/2"
			style="left: {centerX}px; top: {centerY}px;"
		>
			<svg class="overflow-visible" {width} {height}>
				{#each Array(rows) as _, row}
					{#each Array(cols) as _, col}
						{@const fillStyle = isPlacable ? PLANNING_TILE_FILL_STYLE : DISABLED_TILE_FILL_STYLE}
						<rect
							x={col * gridSize + 0.5}
							y={row * gridSize + 0.5}
							width={gridSize - 1}
							height={gridSize - 1}
							fill={fillStyle}
						/>
					{/each}
				{/each}
			</svg>
		</div>
	{/if}

	<!-- 스프라이트 미리보기 -->
	{#if building}
		<BuildingSpriteAnimator
			class="absolute -translate-x-1/2 -translate-y-1/2"
			style="left: {centerX + building.collider_offset_x}px; top: {centerY +
				building.collider_offset_y}px; opacity: {isPlacable ? 0.5 : 0.3};"
			buildingId={building.id}
			stateType="idle"
			resolution={2}
		/>
	{:else if isTile && world.blueprint.cursor}
		<!-- 타일 미리보기 -->
		{#each tileCells as tileCell (vectorUtils.createTileCellKey(tileCell))}
			<QuarterTile
				worldId={world.worldId}
				tileX={tileCell.col}
				tileY={tileCell.row}
				style="opacity: {isPlacable ? 0.5 : 0.3};"
			/>
		{/each}
	{:else if characterId}
		<!-- 캐릭터 미리보기 -->
		<CharacterSpriteAnimator
			class="absolute -translate-x-1/2 -translate-y-1/2"
			style="left: {centerX}px; top: {centerY}px; opacity: {isPlacable ? 0.5 : 0.3};"
			{characterId}
			bodyStateType="idle"
			faceStateType="idle"
			resolution={2}
		/>
	{:else if itemId}
		<!-- 아이템 미리보기 -->
		<ItemSpriteAnimator
			class="absolute -translate-x-1/2 -translate-y-1/2"
			style="left: {centerX}px; top: {centerY}px; opacity: {isPlacable ? 0.5 : 0.3};"
			{itemId}
			stateType="idle"
			resolution={2}
		/>
	{/if}

	<!-- 기존 엔티티의 겹치는 셀 하이라이트 (맨 앞에 렌더링) -->
	{#each overlappingExistingCells as cell (vectorUtils.createCellKey(cell.col, cell.row))}
		<div
			class="absolute border border-red-600"
			style="
				top: {cell.row * CELL_SIZE}px;
				left: {cell.col * CELL_SIZE}px;
				width: {CELL_SIZE}px;
				height: {CELL_SIZE}px;
				background-color: rgba(220, 38, 38, 0.4);
				z-index: 9999;
			"
		></div>
	{/each}
{/if}
