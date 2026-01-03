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
	const { worldBuildingStore, selectedEntityIdStore } = useWorld();

	const worldBuilding = $derived($worldBuildingStore.data[entity.id]);
	const building = $derived(worldBuilding ? $buildingStore.data[worldBuilding.building_id] : undefined);
	const selected = $derived($selectedEntityIdStore.entityId === entity.toEntityId());
</script>

{#if building}
	<div
		class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {entity.x}px; top: {entity.y}px; rotate: {entity.angle}rad;"
	>
		<BuildingSpriteAnimator buildingId={building.id} stateType="idle" resolution={2} {selected} />
	</div>
{/if}
