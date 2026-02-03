<script lang="ts">
	import { useTerrain } from '$lib/hooks';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId } from '$lib/types';

	const { tileStore } = useTerrain();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const tiles = $derived(Object.values($tileStore.data));

	$effect(() => {
		if (tiles.length > 0) {
			const firstTile = tiles[0]!;
			goto(`/admin/scenarios/${scenarioId}/tiles/${firstTile.id}`);
		}
	});
</script>

<div class="flex h-full items-center justify-center">
	{#if tiles.length === 0}
		<p class="text-sm text-muted-foreground">타일을 추가해주세요</p>
	{:else}
		<p class="text-sm text-muted-foreground">타일을 선택해주세요</p>
	{/if}
</div>
