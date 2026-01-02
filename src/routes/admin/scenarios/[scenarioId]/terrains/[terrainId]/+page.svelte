<script lang="ts">
	import { page } from '$app/state';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { useServerPayload } from '$lib/hooks/use-server-payload.svelte';
	import { getGameAssetUrl } from '$lib/utils/storage.svelte';
	import TerrainActionPanel from '$lib/components/admin/terrain/terrain-action-panel.svelte';
	import TerrainPreview from '$lib/components/admin/terrain/terrain-preview.svelte';
	import type { TerrainId } from '$lib/types';

	const { store, admin } = useTerrain();
	const { supabase } = useServerPayload();
	const terrainId = $derived(page.params.terrainId as TerrainId);
	const terrain = $derived(terrainId ? $store.data[terrainId] : undefined);
	const terrainAssetUrl = $derived(
		terrain ? getGameAssetUrl(supabase, 'terrain', terrain) : undefined
	);
</script>

<div class="relative flex h-full flex-col items-center justify-center">
	{#if terrain}
		<TerrainPreview {terrain} {terrainAssetUrl} />
		{#if terrain.game_asset}
			<div class="px-2 py-1 text-xs text-muted-foreground">
				지형 크기 - {terrain.width} × {terrain.height}
			</div>
		{/if}
		<TerrainActionPanel {terrain} />
	{:else}
		<p class="text-sm text-muted-foreground">지형을 찾을 수 없습니다</p>
	{/if}
</div>
