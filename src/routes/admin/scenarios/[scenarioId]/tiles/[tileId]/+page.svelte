<script lang="ts">
	import { page } from '$app/state';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import TileStateItemGroup from '$lib/components/admin/tile/tile-state-item-group.svelte';
	import type { TileId } from '$lib/types';

	const { tileStore } = useTerrain();
	const tileId = $derived(page.params.tileId as TileId);
	const tile = $derived(tileId ? $tileStore.data[tileId] : undefined);
</script>

{#if tile && tileId}
	<div class="flex h-full flex-col">
		<div class="flex p-4 pt-16">
			<TileStateItemGroup {tileId} />
		</div>
	</div>
{:else}
	<div class="flex h-full items-center justify-center">
		<p class="text-sm text-muted-foreground">타일을 찾을 수 없습니다</p>
	</div>
{/if}
