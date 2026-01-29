<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import type { ScenarioId } from '$lib/types';

	const { terrainStore } = useTerrain();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const terrains = $derived(Object.values($terrainStore.data));

	$effect(() => {
		if (terrains.length > 0) {
			const firstTerrain = terrains[0]!;
			goto(`/admin/scenarios/${scenarioId}/terrains/${firstTerrain.id}`);
		}
	});
</script>

<div class="flex h-full items-center justify-center">
	{#if terrains.length === 0}
		<p class="text-sm text-muted-foreground">지형을 추가해주세요</p>
	{:else}
		<p class="text-sm text-muted-foreground">지형을 선택해주세요</p>
	{/if}
</div>
