<script lang="ts">
	import type { WorldTileEntity } from './world-tile-entity.svelte';
	import { TILE_SIZE } from '$lib/constants';
	import { useWorld } from '$lib/hooks/use-world';
	import QuarterTile from '$lib/components/app/world/tiles/quarter-tile.svelte';

	interface Props {
		entity: WorldTileEntity;
	}

	let { entity }: Props = $props();

	const { selectedEntityIdStore } = useWorld();

	// 타일 중심 좌표 계산
	const coords = $derived(entity.instanceId.split(',').map(Number));
	const tileX = $derived(coords[0] ?? 0);
	const tileY = $derived(coords[1] ?? 0);

	const selected = $derived($selectedEntityIdStore.entityId === entity.id);
</script>

<!-- 선택 시 외곽선 -->
{#if selected}
	<div
		class="absolute outline-1 outline-green-400"
		style="left: {tileX * TILE_SIZE}px; top: {tileY *
			TILE_SIZE}px; width: {TILE_SIZE}px; height: {TILE_SIZE}px;"
	></div>
{/if}

<QuarterTile worldId={entity.worldId} {tileX} {tileY} />
