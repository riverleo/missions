<script lang="ts">
	import { useWorldContext } from '$lib/hooks/use-world';
	import { useBuilding } from '$lib/hooks/use-building';
	import { SpriteAnimator } from '$lib/components/app/sprite-animator/sprite-animator.svelte';
	import SpriteAnimatorRenderer from '$lib/components/app/sprite-animator/sprite-animator-renderer.svelte';
	import WorldPlanningPlacementRect from './world-planning-placement-rect.svelte';
	import { TILE_SIZE } from './constants';

	const world = useWorldContext();
	const { stateStore: buildingStateStore } = useBuilding();

	// 배치 미리보기용 animator
	let animator = $state<SpriteAnimator | undefined>(undefined);

	// 배치할 건물의 상태 조회
	const placementBuilding = $derived(world.planning.placement?.building);
	const buildingStates = $derived(
		placementBuilding ? ($buildingStateStore.data[placementBuilding.id] ?? []) : []
	);

	// 좌상단 타일 인덱스를 건물 중심 픽셀 좌표로 변환
	const centerX = $derived(() => {
		if (!world.planning.placement) return 0;
		const { tileX, building } = world.planning.placement;
		const width = building.tile_cols * TILE_SIZE;
		return tileX * TILE_SIZE + width / 2;
	});

	const centerY = $derived(() => {
		if (!world.planning.placement) return 0;
		const { tileY, building } = world.planning.placement;
		const height = building.tile_rows * TILE_SIZE;
		return tileY * TILE_SIZE + height / 2;
	});

	// placement가 변경되면 animator 생성
	$effect(() => {
		const idleState = buildingStates.find((s) => s.type === 'idle');
		const atlasName = idleState?.atlas_name;

		if (!atlasName) {
			animator?.stop();
			animator = undefined;
			return;
		}

		SpriteAnimator.create(atlasName).then((newAnimator) => {
			animator?.stop();
			newAnimator.init({
				name: 'idle',
				from: idleState?.frame_from ?? undefined,
				to: idleState?.frame_to ?? undefined,
				fps: idleState?.fps ?? undefined,
			});
			newAnimator.play({ name: 'idle', loop: idleState?.loop ?? 'loop' });
			animator = newAnimator;
		});

		return () => {
			animator?.stop();
		};
	});
</script>

{#if world.planning.placement}
	{@const x = centerX()}
	{@const y = centerY()}
	<!-- 배치 셀 하이라이트 -->
	<div
		class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {x}px; top: {y}px;"
	>
		<WorldPlanningPlacementRect
			cols={world.planning.placement.building.tile_cols}
			rows={world.planning.placement.building.tile_rows}
		/>
	</div>

	<!-- 건물 스프라이트 미리보기 -->
	{#if animator}
		<div
			class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 opacity-50"
			style="left: {x}px; top: {y}px;"
		>
			<SpriteAnimatorRenderer {animator} resolution={2} />
		</div>
	{/if}
{/if}
