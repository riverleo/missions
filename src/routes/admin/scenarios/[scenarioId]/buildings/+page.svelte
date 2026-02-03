<script lang="ts">
	import { useBuilding } from '$lib/hooks';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId } from '$lib/types';

	const { buildingStore } = useBuilding();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const buildings = $derived(Object.values($buildingStore.data));

	$effect(() => {
		if (buildings.length > 0) {
			const firstBuilding = buildings[0]!;
			goto(`/admin/scenarios/${scenarioId}/buildings/${firstBuilding.id}`);
		}
	});
</script>

<div class="flex h-full items-center justify-center">
	{#if buildings.length === 0}
		<p class="text-sm text-muted-foreground">건물을 추가해주세요</p>
	{:else}
		<p class="text-sm text-muted-foreground">건물을 선택해주세요</p>
	{/if}
</div>
