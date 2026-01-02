<script lang="ts">
	import { page } from '$app/state';
	import { produce } from 'immer';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { useWorld } from '$lib/hooks/use-world';
	import WorldComponent from '$lib/components/app/world/world.svelte';
	import TerrainPanel from '$lib/components/admin/terrain/terrain-panel.svelte';
	import TerrainMarker from '$lib/components/admin/terrain/terrain-marker.svelte';
	import type { TerrainId, WorldId, World, PlayerId } from '$lib/types';

	const TERRAIN_PREVIEW_WORLD_ID = 'terrain-preview-world-id' as WorldId;

	const { store, admin } = useTerrain();
	const { worldStore } = useWorld();
	const uiStore = admin.uiStore;
	const terrainId = $derived(page.params.terrainId as TerrainId);
	const terrain = $derived(terrainId ? $store.data[terrainId] : undefined);

	// terrain 변경 시 worldStore에 World 객체 추가
	$effect(() => {
		if (terrain) {
			worldStore.update((state) =>
				produce(state, (draft) => {
					const world: World = {
						id: TERRAIN_PREVIEW_WORLD_ID,
						user_id: crypto.randomUUID(),
						player_id: crypto.randomUUID() as PlayerId,
						scenario_id: terrain.scenario_id,
						terrain: terrain,
						name: 'Terrain Preview',
						created_at: new Date().toISOString(),
					};
					draft.data[TERRAIN_PREVIEW_WORLD_ID] = world;
				})
			);
		} else {
			worldStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[TERRAIN_PREVIEW_WORLD_ID];
				})
			);
		}
	});
</script>

<div class="relative flex h-full flex-col items-center justify-center">
	{#if terrain}
		<WorldComponent worldId={TERRAIN_PREVIEW_WORLD_ID} debug={$uiStore.debug}>
			<TerrainMarker {terrain} />
		</WorldComponent>
		{#if terrain.game_asset}
			<div class="px-2 py-1 text-xs text-muted-foreground">
				지형 크기 - {terrain.width} × {terrain.height}
			</div>
		{/if}
		<TerrainPanel {terrain} />
	{:else}
		<p class="text-sm text-muted-foreground">지형을 찾을 수 없습니다</p>
	{/if}
</div>
