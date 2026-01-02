<script lang="ts">
	import { useWorldContext } from '$lib/hooks/use-world';
	import { useBuilding } from '$lib/hooks/use-building';
	import BuildingSpriteAnimator from '$lib/components/app/sprite-animator/building-sprite-animator.svelte';
	import WorldBlueprintPlacementRect from './world-blueprint-placement-rect.svelte';
	import { TILE_SIZE } from './constants';

	const world = useWorldContext();
	const { stateStore: buildingStateStore } = useBuilding();

	// 배치할 건물의 상태 조회
	const placementBuilding = $derived(world.blueprint.cursor?.building);
	const buildingStates = $derived(
		placementBuilding ? ($buildingStateStore.data[placementBuilding.id] ?? []) : []
	);
	const buildingIdleState = $derived(buildingStates.find((s) => s.type === 'idle'));

	// 좌상단 타일 인덱스를 건물 중심 픽셀 좌표로 변환
	const centerX = $derived(() => {
		if (!world.blueprint.cursor) return 0;
		const { tileX, building } = world.blueprint.cursor;
		const width = building.tile_cols * TILE_SIZE;
		return tileX * TILE_SIZE + width / 2;
	});

	const centerY = $derived(() => {
		if (!world.blueprint.cursor) return 0;
		const { tileY, building } = world.blueprint.cursor;
		const height = building.tile_rows * TILE_SIZE;
		return tileY * TILE_SIZE + height / 2;
	});
</script>

{#if world.blueprint.cursor}
	{@const x = centerX()}
	{@const y = centerY()}
	<!-- 배치 셀 하이라이트 -->
	<div
		class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {x}px; top: {y}px;"
	>
		<WorldBlueprintPlacementRect
			cols={world.blueprint.cursor.building.tile_cols}
			rows={world.blueprint.cursor.building.tile_rows}
		/>
	</div>

	<!-- 건물 스프라이트 미리보기 -->
	{#if buildingIdleState}
		<div
			class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 opacity-50"
			style="left: {x}px; top: {y}px;"
		>
			<BuildingSpriteAnimator buildingState={buildingIdleState} resolution={2} />
		</div>
	{/if}
{/if}
