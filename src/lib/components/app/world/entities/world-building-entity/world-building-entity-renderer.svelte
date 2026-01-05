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

	// 스프라이트 위치 계산 (바디 바닥 = 스프라이트 바닥)
	const spriteX = $derived(entity.x + (building?.collider_offset_x ?? 0));
	const spriteY = $derived(entity.y + entity.height / 2 + (building?.collider_offset_y ?? 0));

	// 디버그 모드일 때 opacity 낮춤
	const opacity = $derived(entity.debug ? 0.3 : 1);
</script>

{#if building}
	<BuildingSpriteAnimator
		buildingId={building.id}
		stateType="idle"
		resolution={2}
		{selected}
		class="pointer-events-none absolute -translate-x-1/2 -translate-y-full"
		style="left: {spriteX}px; top: {spriteY}px; rotate: {entity.angle}rad; opacity: {opacity};"
	/>
{/if}
