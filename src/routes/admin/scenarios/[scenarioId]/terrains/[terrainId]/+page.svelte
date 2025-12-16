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

<div class="relative flex h-full items-center justify-center">
	{#if terrain}
		<div class="h-[400px] w-[800px]">
			<World {terrain} debug={$uiStore.debug}>
				<TerrainMarker {terrain} />
			</World>
		</div>
		<TerrainPanel {terrain} />
	{:else}
		<p class="text-sm text-muted-foreground">지형을 찾을 수 없습니다</p>
	{/if}
</div>
