<script lang="ts">
	import { page } from '$app/state';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import World from '$lib/components/app/world/world.svelte';
	import TerrainPanel from '$lib/components/admin/terrain/terrain-panel.svelte';
	import TerrainMarker from '$lib/components/admin/terrain/terrain-marker.svelte';

	const { store, admin } = useTerrain();
	const uiStore = admin.uiStore;
	const terrainId = $derived(page.params.terrainId);
	const terrain = $derived(terrainId ? $store.data[terrainId] : undefined);
</script>

<div class="relative flex h-full flex-col items-center justify-center">
	{#if terrain}
		<World {terrain} debug={$uiStore.debug}>
			<TerrainMarker {terrain} />
		</World>
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
