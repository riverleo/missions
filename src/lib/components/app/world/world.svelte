<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WorldId } from '$lib/types';
	import { setWorldContext, useWorld } from '$lib/hooks/use-world';
	import { WorldContext } from './context';
	import type { Camera } from './camera.svelte';
	import WorldRenderer from './world-renderer.svelte';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		width?: number;
		height?: number;
		worldId: WorldId;
		debug?: boolean;
		children?: Snippet;
		oncamerachange?: (camera: Camera) => void;
	}

	let {
		width = 800,
		height = 400,
		worldId,
		debug = false,
		children,
		oncamerachange,
		...restProps
	}: Props = $props();

	const worldContext = new WorldContext(worldId, debug);
	const { worldStore, worldCharacterStore, worldBuildingStore } = useWorld();

	// worldId로 useWorld에서 world 조회
	const world = $derived($worldStore.data[worldId]);
	const terrain = $derived(world?.terrain ?? null);

	// oncamerachange prop 변경 시 worldContext 업데이트
	$effect(() => {
		worldContext.oncamerachange = oncamerachange;
	});

	// world의 terrain 변경 시 load 호출
	$effect(() => {
		const currentTerrain = world?.terrain;
		if (currentTerrain) {
			worldContext.load();
		}
	});

	// debug prop 변경 시 worldContext 업데이트
	$effect(() => {
		worldContext.debug = debug;
		worldContext.setDebugEntities(debug);
	});

	// 카메라 변경 시 렌더 바운드 업데이트
	$effect(() => {
		worldContext.updateRenderBounds();
	});

	// worldBuildings 변경 시 엔티티 동기화
	$effect(() => {
		const buildings = Object.fromEntries(
			Object.values($worldBuildingStore.data)
				.filter((b) => !worldId || b.world_id === worldId)
				.map((b) => [b.id, b])
		);
		worldContext.syncWorldBuildingEntities(buildings);
	});

	// worldCharacters 변경 시 엔티티 동기화
	$effect(() => {
		const characters = Object.fromEntries(
			Object.values($worldCharacterStore.data)
				.filter((c) => !worldId || c.world_id === worldId)
				.map((c) => [c.id, c])
		);
		worldContext.syncWorldCharacterEntities(characters);
	});

	setWorldContext(worldContext);
</script>

{#if world}
	<WorldRenderer {...restProps} {width} {height}>
		{@render children?.()}
	</WorldRenderer>
{:else}
	<div
		class="flex flex-col items-center justify-center"
		style="width: {width}px; height: {height}px;"
	>
		<p class="text-sm text-muted-foreground">존재하지 않는 세계입니다.</p>
		<p class="text-sm text-muted">아이디 - {worldId}</p>
	</div>
{/if}
