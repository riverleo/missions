<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import 'pathseg';
	import { useWorldContext, useWorld } from '$lib/hooks/use-world';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { useServerPayload } from '$lib/hooks/use-server-payload.svelte';
	import { getGameAssetUrl } from '$lib/utils/storage.svelte';
	import {
		WorldCharacterEntityRenderer,
		type WorldCharacterEntity,
	} from './entities/world-character-entity';
	import {
		WorldBuildingEntityRenderer,
		type WorldBuildingEntity,
	} from './entities/world-building-entity';
	import { WorldItemEntityRenderer, type WorldItemEntity } from './entities/world-item-entity';
	import { WorldTileEntityRenderer, type WorldTileEntity } from './entities/world-tile-entity';
	import WorldBlueprint from './world-blueprint.svelte';
	import WorldPathfindingDebug from './world-pathfinding-debug.svelte';
	import { cn } from '$lib/utils';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		width: number;
		height: number;
		children?: Snippet;
	}

	let { class: className, width, height, children, ...restProps }: Props = $props();

	const world = useWorldContext();
	const { camera, event } = world;
	const { worldStore } = useWorld();
	const { store: terrainStore } = useTerrain();
	const { supabase } = useServerPayload();

	// terrain을 terrainStore에서 구독
	const terrainId = $derived($worldStore.data[world.worldId]?.terrain_id);
	const terrain = $derived(terrainId ? $terrainStore.data[terrainId] : undefined);

	// terrain asset URL을 $derived로 관리
	const terrainAssetUrl = $derived(
		terrain ? getGameAssetUrl(supabase, 'terrain', terrain) : undefined
	);

	let element: HTMLDivElement;

	// worldId 필터링된 entities
	const entities = $derived(Object.values(world.entities));

	// 카메라 줌 핸들러
	function onwheel(e: WheelEvent) {
		e.preventDefault();
		camera.applyZoom(e.deltaY, e.clientX, e.clientY);
	}

	onMount(() => world.load({ element, width: width, height: height }));
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	bind:this={element}
	data-slot="world-container"
	{...restProps}
	class={cn('relative overflow-hidden border border-border', className)}
	style="width: {width}px; height: {height}px;"
	role="application"
	{onwheel}
	onmousedown={event.onmousedown}
	onmousemove={event.onmousemove}
	onmouseup={event.onmouseup}
	onmouseleave={event.onmouseup}
>
	<!-- 월드 레이어: 카메라 transform 일괄 적용 -->
	<div
		class="pointer-events-none absolute origin-top-left"
		style="
			width: {terrain?.width ?? 0}px;
			height: {terrain?.height ?? 0}px;
			transform: scale({camera.zoom}) translate({-camera.x}px, {-camera.y}px);
		"
	>
		{#if terrainAssetUrl}
			<img src={terrainAssetUrl} class="absolute inset-0 h-full w-full" alt={terrain?.title} />
		{/if}
		<WorldPathfindingDebug />
		<WorldBlueprint />
		{#each entities as entity (entity.id)}
			{#if entity.type === 'tile'}
				<WorldTileEntityRenderer entity={entity as WorldTileEntity} />
			{:else if entity.type === 'building'}
				<WorldBuildingEntityRenderer entity={entity as WorldBuildingEntity} />
			{:else if entity.type === 'character'}
				<WorldCharacterEntityRenderer entity={entity as WorldCharacterEntity} />
			{:else if entity.type === 'item'}
				<WorldItemEntityRenderer entity={entity as WorldItemEntity} />
			{/if}
		{/each}
	</div>

	<!-- 오버레이 레이어: pointer-events를 받을 수 있는 별도 레이어 -->
	{@render children?.()}
</div>
