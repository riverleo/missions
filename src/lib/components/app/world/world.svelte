<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WorldId, Terrain } from '$lib/types';
	import { setWorldContext, useWorld } from '$lib/hooks/use-world';
	import { useServerPayload } from '$lib/hooks/use-server-payload.svelte';
	import { useScenario } from '$lib/hooks/use-scenario';
	import { WorldContext } from './context';
	import type { Camera } from './camera.svelte';
	import WorldRenderer from './world-renderer.svelte';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		width?: number;
		height?: number;
		worldId?: WorldId;
		terrain?: Terrain;
		debug?: boolean;
		children?: Snippet;
		oncamerachange?: (camera: Camera) => void;
	}

	let {
		width = 800,
		height = 400,
		worldId,
		terrain: terrainProp,
		debug = false,
		children,
		oncamerachange,
		...restProps
	}: Props = $props();

	const { supabase } = useServerPayload();
	const worldContext = new WorldContext(supabase, debug, worldId);
	const { worldStore, worldCharacterStore, worldBuildingStore } = useWorld();
	const { fetchAllStatus } = useScenario();

	// worldId가 있으면 useWorld에서 데이터 조회, 없으면 props 사용
	const terrain = $derived(() => {
		if (worldId) {
			const world = $worldStore.data[worldId];
			return world?.terrain ?? null;
		}
		return terrainProp ?? null;
	});

	// oncamerachange prop 변경 시 worldContext 업데이트
	$effect(() => {
		worldContext.oncamerachange = oncamerachange;
	});

	// terrain 변경 시 worldContext 업데이트 (id 또는 game_asset이 변경되었을 때만)
	let prevTerrainKey = '';
	$effect(() => {
		const currentTerrain = terrain();
		if (!currentTerrain) return;
		const key = `${currentTerrain.id}:${currentTerrain.game_asset}`;
		if (key !== prevTerrainKey) {
			prevTerrainKey = key;
			worldContext.terrain = currentTerrain;
		}
	});

	// debug prop 변경 시 worldContext 업데이트
	$effect(() => {
		worldContext.debug = debug;
		worldContext.setDebugEntities(debug);
	});

	// terrain 변경 시 reload
	$effect(() => {
		if (worldContext.initialized && worldContext.terrain) {
			worldContext.reload();
		}
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

{#if terrain() && $fetchAllStatus === 'success'}
	<WorldRenderer {...restProps} {width} {height}>
		{@render children?.()}
	</WorldRenderer>
{/if}
