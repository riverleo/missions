<script lang="ts">
	import type { WorldBuildingEntity } from './world-building-entity.svelte';
	import { SpriteAnimator } from '$lib/components/app/sprite-animator/sprite-animator.svelte';
	import SpriteAnimatorRenderer from '$lib/components/app/sprite-animator/sprite-animator-renderer.svelte';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useWorld } from '$lib/hooks/use-world.svelte';

	interface Props {
		entity: WorldBuildingEntity;
	}

	let { entity }: Props = $props();

	const world = useWorld();
	const { terrainBody } = world;
	const { store: buildingStore, stateStore: buildingStateStore } = useBuilding();

	const worldBuilding = $derived(world.buildings[entity.id]);
	const building = $derived(worldBuilding ? $buildingStore.data[worldBuilding.building_id] : undefined);
	const buildingStates = $derived(building ? ($buildingStateStore.data[building.id] ?? []) : []);
	const buildingState = $derived(buildingStates.find((s) => s.type === 'idle'));

	let animator = $state<SpriteAnimator | undefined>(undefined);

	// 월드 좌표를 퍼센트로 변환 (부모 월드 레이어 기준)
	const left = $derived(`${(entity.position.x / terrainBody.width) * 100}%`);
	const top = $derived(`${(entity.position.y / terrainBody.height) * 100}%`);
	const rotation = $derived(`${entity.position.angle}rad`);

	// buildingState가 변경되면 animator 생성
	$effect(() => {
		if (!buildingState) {
			animator?.stop();
			animator = undefined;
			return;
		}

		const atlasName = buildingState.atlas_name;

		SpriteAnimator.create(atlasName).then((newAnimator) => {
			animator?.stop();
			newAnimator.init({
				name: buildingState.type,
				from: buildingState.frame_from ?? undefined,
				to: buildingState.frame_to ?? undefined,
				fps: buildingState.fps ?? undefined,
			});
			newAnimator.play({
				name: buildingState.type,
				loop: buildingState.loop ?? 'loop',
			});
			animator = newAnimator;
		});

		return () => {
			animator?.stop();
		};
	});
</script>

{#if animator}
	<div
		class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {left}; top: {top}; rotate: {rotation};"
	>
		<SpriteAnimatorRenderer {animator} resolution={2} />
	</div>
{/if}
