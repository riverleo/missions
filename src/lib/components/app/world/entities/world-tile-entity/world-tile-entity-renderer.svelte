<script lang="ts">
	import type { WorldTileEntity } from './world-tile-entity.svelte';
	import TileSpriteAnimator from '$lib/components/app/sprite-animator/tile-sprite-animator.svelte';
	import { TILE_SIZE } from '../../constants';
	import { tileToCenterPixel } from '../../tiles';
	import { useWorld } from '$lib/hooks/use-world';

	interface Props {
		entity: WorldTileEntity;
	}

	let { entity }: Props = $props();

	const { selectedEntityIdStore } = useWorld();

	// 타일 중심 좌표 계산
	const coords = $derived(entity.instanceId.split(',').map(Number));
	const tileX = $derived(coords[0] ?? 0);
	const tileY = $derived(coords[1] ?? 0);
	const centerX = $derived(tileToCenterPixel(tileX));
	const centerY = $derived(tileY * TILE_SIZE + TILE_SIZE / 2);

	const selected = $derived($selectedEntityIdStore.entityId === entity.id);

	// 디버그 모드일 때 opacity 낮춤
	const opacity = $derived(entity.debug ? 0.3 : 1);
</script>

<!-- 선택 시 외곽선 -->
{#if selected}
	<div
		class="absolute outline-1 outline-green-400"
		style="left: {tileX * TILE_SIZE}px; top: {tileY *
			TILE_SIZE}px; width: {TILE_SIZE}px; height: {TILE_SIZE}px;"
	></div>
{/if}

<TileSpriteAnimator
	tileId={entity.tileId}
	stateType="idle"
	index={2}
	class="absolute -translate-x-1/2 -translate-y-1/2"
	style="left: {centerX}px; top: {centerY}px; opacity: {opacity};"
/>
