<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WorldId } from '$lib/types';
	import { setWorldContext, useWorld } from '$lib/hooks/use-world';
	import { useServerPayload } from '$lib/hooks/use-server-payload.svelte';
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

	const { supabase } = useServerPayload();
	const worldContext = new WorldContext(supabase, debug, worldId);
	const { worldStore, worldCharacterStore, worldBuildingStore } = useWorld();

	// worldId로 useWorld에서 terrain 조회
	const terrain = $derived(() => {
		const world = $worldStore.data[worldId];
		return world?.terrain ?? null;
	});

	// oncamerachange prop 변경 시 worldContext 업데이트
	$effect(() => {
		worldContext.oncamerachange = oncamerachange;
	});

	// terrain 변경 시 worldContext 업데이트 및 reload
	let prevTerrainKey = '';
	$effect(() => {
		const currentTerrain = terrain();
		if (!currentTerrain) return;
		const key = `${currentTerrain.id}:${currentTerrain.game_asset}`;
		if (key !== prevTerrainKey) {
			prevTerrainKey = key;
			worldContext.terrain = currentTerrain;

			// initialized 상태에서만 reload
			if (worldContext.initialized) {
				worldContext.reload();
			}
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

{#if terrain()}
	<WorldRenderer {...restProps} {width} {height}>
		{@render children?.()}
	</WorldRenderer>
{/if}
