<script lang="ts">
	import type { WorldBuildingEntity } from './world-building-entity.svelte';
	import BuildingSpriteAnimator from '$lib/components/app/sprite-animator/building-sprite-animator.svelte';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useWorld } from '$lib/hooks/use-world';

	interface Props {
		entity: WorldBuildingEntity;
	}

	let { entity }: Props = $props();

	const { store: buildingStore, stateStore: buildingStateStore } = useBuilding();
	const { worldBuildingStore, selectedEntityStore } = useWorld();

	const worldBuilding = $derived($worldBuildingStore.data[entity.id]);
	const building = $derived(worldBuilding ? $buildingStore.data[worldBuilding.building_id] : undefined);
	const buildingStates = $derived(building ? ($buildingStateStore.data[building.id] ?? []) : []);
	const buildingState = $derived(buildingStates.find((s) => s.type === 'idle'));
	const selected = $derived($selectedEntityStore.entityId === entity.toEntityId());
</script>

{#if buildingState}
	<div
		class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {entity.x}px; top: {entity.y}px; rotate: {entity.angle}rad;"
	>
		<BuildingSpriteAnimator {buildingState} resolution={2} {selected} />
	</div>
{/if}
