<script lang="ts">
	import { useTerrain, useWorld, useWorldContext } from '$lib/hooks';
	import { onMount, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import 'pathseg';
	import { vectorUtils } from '$lib/utils/vector';
	import { useApp } from '$lib/hooks';
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
	import WorldPathfinderDebug from './world-pathfinder-debug.svelte';
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
	const { terrainStore } = useTerrain();
	const { supabase } = useApp();

	// terrain을 terrainStore에서 구독
	const terrainId = $derived($worldStore.data[world.worldId]?.terrain_id);
	const terrain = $derived(terrainId ? $terrainStore.data[terrainId] : undefined);

	// terrain asset URL을 $derived로 관리
	const terrainAssetUrl = $derived(
		terrain ? getGameAssetUrl(supabase, 'terrain', terrain) : undefined
	);

	let element: HTMLDivElement;

	// worldId 필터링된 entities - 타입별로 분리
	const entities = $derived(Object.values(world.entities));
	const worldTileEntities = $derived(
		entities.filter((e): e is WorldTileEntity => e.type === 'tile')
	);
	const worldBuildingEntities = $derived(
		entities.filter((e): e is WorldBuildingEntity => e.type === 'building')
	);
	const worldItemEntities = $derived(
		entities.filter((e): e is WorldItemEntity => e.type === 'item')
	);
	const worldCharacterEntities = $derived(
		entities.filter((e): e is WorldCharacterEntity => e.type === 'character')
	);

	// 카메라 줌 핸들러
	function onwheel(e: WheelEvent) {
		e.preventDefault();
		camera.applyZoom(e.deltaY, vectorUtils.createScreenVector(e.clientX, e.clientY));
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
		<WorldPathfinderDebug />

		<!-- 타일 레이어 -->
		{#each worldTileEntities as entity (entity.id)}
			<WorldTileEntityRenderer {entity} />
		{/each}

		<!-- 건물 레이어 -->
		{#each worldBuildingEntities as entity (entity.id)}
			<WorldBuildingEntityRenderer {entity} />
		{/each}

		<!-- 아이템 레이어 -->
		{#each worldItemEntities as entity (entity.id)}
			<WorldItemEntityRenderer {entity} />
		{/each}

		<!-- 캐릭터 레이어 (최상단) -->
		{#each worldCharacterEntities as entity (entity.id)}
			<WorldCharacterEntityRenderer {entity} />
		{/each}

		<WorldBlueprint />
	</div>

	<!-- 오버레이 레이어: pointer-events를 받을 수 있는 별도 레이어 -->
	{@render children?.()}
</div>
