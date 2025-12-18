<script lang="ts">
	import { useWorld } from '$lib/hooks/use-world.svelte';
	import { SpriteAnimator } from '$lib/components/app/sprite-animator/sprite-animator.svelte';
	import SpriteAnimatorRenderer from '$lib/components/app/sprite-animator/sprite-animator-renderer.svelte';
	import WorldPlanningPlacementRect from './world-planning-placement-rect.svelte';

	const world = useWorld();

	// 배치 미리보기용 animator
	let animator = $state<SpriteAnimator | undefined>(undefined);

	// placement가 변경되면 animator 생성
	$effect(() => {
		const building = world.planning.placement?.building;
		const idleState = building?.building_states.find((s) => s.type === 'idle');
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
	<!-- 배치 셀 하이라이트 -->
	<div
		class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {world.planning.placement.x}px; top: {world.planning.placement.y}px;"
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
			style="left: {world.planning.placement.x}px; top: {world.planning.placement.y}px;"
		>
			<SpriteAnimatorRenderer {animator} resolution={2} />
		</div>
	{/if}
{/if}
