<script lang="ts">
	import type { WorldBuildingEntity } from './world-building-entity.svelte';
	import BuildingSpriteAnimator from '$lib/components/app/sprite-animator/building-sprite-animator.svelte';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useWorld } from '$lib/hooks/use-world';

	interface Props {
		entity: WorldBuildingEntity;
	}

	let { entity }: Props = $props();

	const { store: buildingStore } = useBuilding();
	const { worldBuildingStore, selectedEntityIdStore } = useWorld();

	const worldBuilding = $derived($worldBuildingStore.data[entity.id]);
	const building = $derived(
		worldBuilding ? $buildingStore.data[worldBuilding.building_id] : undefined
	);
	const selected = $derived($selectedEntityIdStore.entityId === entity.toEntityId());

	// 디버그 모드일 때 opacity 낮춤
	const opacity = $derived(entity.debug ? 0.3 : 1);
</script>

{#if building}
	<BuildingSpriteAnimator
		buildingId={building.id}
		stateType="idle"
		resolution={2}
		{selected}
		class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {entity.x}px; top: {entity.y}px; rotate: {entity.angle}rad; opacity: {opacity};"
	/>
{/if}
