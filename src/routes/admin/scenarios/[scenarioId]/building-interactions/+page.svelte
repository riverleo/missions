<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useBuilding } from '$lib/hooks/use-building';
	import type { ScenarioId } from '$lib/types';

	const { buildingInteractionStore } = useBuilding();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	$effect(() => {
		const interactions = Object.values($buildingInteractionStore.data);
		if (interactions.length > 0) {
			const firstInteraction = interactions[0]!;
			goto(`/admin/scenarios/${scenarioId}/building-interactions/${firstInteraction.id}`);
		}
	});
</script>

<div class="flex h-full items-center justify-center">
	<p class="text-sm text-muted-foreground">건물 상호작용을 선택하세요</p>
</div>
