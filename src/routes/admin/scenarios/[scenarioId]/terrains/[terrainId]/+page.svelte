<script lang="ts">
	import { page } from '$app/state';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import World from '$lib/components/app/world/world.svelte';
	import TerrainPanel from '$lib/components/admin/terrain/terrain-panel.svelte';

	const { store } = useTerrain();
	const terrainId = $derived(page.params.terrainId);
	const terrain = $derived(terrainId ? $store.data[terrainId] : undefined);

	let debug = $state(false);

	function ontoggleDebug() {
		debug = !debug;
	}
</script>

<div class="relative flex h-full items-center justify-center">
	{#if terrain}
		<div class="h-[400px] w-[800px]">
			<World {terrain} {debug} />
		</div>
		<TerrainPanel {terrain} {debug} {ontoggleDebug} />
	{:else}
		<p class="text-sm text-muted-foreground">지형을 찾을 수 없습니다</p>
	{/if}
</div>
