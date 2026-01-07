<script lang="ts">
	import type { WorldTileEntity } from './world-tile-entity.svelte';
	import TileSpriteAnimator from '$lib/components/app/sprite-animator/tile-sprite-animator.svelte';
	import { TILE_SIZE } from '../../constants';
	import { tileToCenterPixel } from '../../tiles';

	interface Props {
		entity: WorldTileEntity;
	}

	let { entity }: Props = $props();

	// 타일 중심 좌표 계산
	const coords = $derived(entity.id.split(',').map(Number));
	const tileX = $derived(coords[0] ?? 0);
	const tileY = $derived(coords[1] ?? 0);
	const centerX = $derived(tileToCenterPixel(tileX));
	const centerY = $derived(tileY * TILE_SIZE + TILE_SIZE / 2);

	// 디버그 모드일 때 opacity 낮춤
	const opacity = $derived(entity.debug ? 0.3 : 1);
</script>

<TileSpriteAnimator
	tileId={entity.tileId}
	stateType="idle"
	resolution={2}
	class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
	style="left: {centerX}px; top: {centerY}px; opacity: {opacity};"
/>
