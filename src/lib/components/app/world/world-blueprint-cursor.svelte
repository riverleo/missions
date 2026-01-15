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
	import type { BuildingId, CharacterId, ItemId, Vector } from '$lib/types';

	const world = useWorldContext();
	const { store: buildingStore } = useBuilding();

	const entityTemplateId = $derived(world.blueprint.cursor?.entityTemplateId);
	const tileVectors = $derived(world.blueprint.getVectorsFromStart());

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

	// 겹치는 셀들을 Set으로 변환 (빠른 조회용)
	const overlappingVectors = $derived(() => {
		const cells = world.blueprint.getOverlappingCells();
		return new Set(cells.map((c) => `${c.col},${c.row}`));
	});

	// 셀이 겹치는지 확인 (절대 좌표 기준)
	function isVectorOverlapping(vector: Vector): boolean {
		if (!world.blueprint.cursor) return false;

		const { x, y } = world.blueprint.cursor.current;

		// 타일인 경우 타일 좌표를 셀 좌표로 변환
		if (world.blueprint.cursor.type === 'tile') {
			const cellX = x * 2;
			const cellY = y * 2;
			// 타일은 2x2 셀을 차지하므로 각 셀을 체크
			for (let dy = 0; dy < 2; dy++) {
				for (let dx = 0; dx < 2; dx++) {
					if (overlappingVectors().has(`${cellX + dx},${cellY + dy}`)) {
						return true;
					}
				}
			}
			return false;
		}

		// 셀인 경우 그대로 사용
		const absoluteCol = x + vector.x;
		const absoluteRow = y + vector.y;

		return overlappingVectors().has(`${absoluteCol},${absoluteRow}`);
	}

	const OVERLAP_TILE_FILL_STYLE = 'rgba(239, 68, 68, 0.8)';
	const PLANNING_TILE_FILL_STYLE = 'rgba(255, 255, 255, 0.8)';
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
						{@const isOverlapping = isVectorOverlapping(vectorUtils.createVector(col, row))}
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
	{:else if isTile && world.blueprint.cursor}
		<!-- 타일 미리보기 -->
		{#each tileVectors as vector (vector.x + ',' + vector.y)}
			{@const tileCell = vectorUtils.vectorToTileCell(vector)}
			<QuarterTile
				worldId={world.worldId}
				tileX={tileCell.col}
				tileY={tileCell.row}
				style="opacity: 0.5;"
			/>
		{/each}
	{:else if characterId}
		<!-- 캐릭터 미리보기 -->
		<CharacterSpriteAnimator
			class="absolute -translate-x-1/2 -translate-y-1/2 opacity-50"
			style="left: {centerX}px; top: {centerY}px;"
			{characterId}
			bodyStateType="idle"
			faceStateType="idle"
			resolution={2}
		/>
	{:else if itemId}
		<!-- 아이템 미리보기 -->
		<ItemSpriteAnimator
			class="absolute -translate-x-1/2 -translate-y-1/2 opacity-50"
			style="left: {centerX}px; top: {centerY}px;"
			{itemId}
			stateType="idle"
			resolution={2}
		/>
	{/if}
{/if}
