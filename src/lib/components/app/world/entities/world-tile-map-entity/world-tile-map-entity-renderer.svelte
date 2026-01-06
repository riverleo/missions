<script lang="ts">
	import type { WorldTileMapEntity } from './world-tile-map-entity.svelte';
	import TileSpriteAnimator from '$lib/components/app/sprite-animator/tile-sprite-animator.svelte';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { TILE_SIZE } from '../../constants';

	interface Props {
		entity: WorldTileMapEntity;
	}

	let { entity }: Props = $props();

	const { tileStore } = useTerrain();

	// entity의 data state를 직접 참조
	const tiles = $derived(entity.data);

	// 디버그 모드일 때 opacity 낮춤
	const opacity = $derived(entity.debug ? 0.3 : 1);
</script>

{#each Object.entries(tiles) as [vector, tileData] (vector)}
	{@const coords = vector.split(',').map(Number)}
	{@const tileX = coords[0]}
	{@const tileY = coords[1]}
	{@const tile = $tileStore.data[tileData.tile_id]}

	{#if tile && tileX !== undefined && tileY !== undefined}
		{@const centerX = tileX * TILE_SIZE + TILE_SIZE / 2}
		{@const centerY = tileY * TILE_SIZE + TILE_SIZE / 2}

		<TileSpriteAnimator
			tileId={tile.id}
			stateType="idle"
			resolution={2}
			class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
			style="left: {centerX}px; top: {centerY}px; opacity: {opacity};"
		/>
	{/if}
{/each}
