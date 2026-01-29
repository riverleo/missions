<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useItem } from '$lib/hooks/use-item';
	import type { ScenarioId } from '$lib/types';

	const { itemInteractionStore } = useItem();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	$effect(() => {
		const interactions = Object.values($itemInteractionStore.data);
		if (interactions.length > 0) {
			const firstInteraction = interactions[0]!;
			goto(`/admin/scenarios/${scenarioId}/item-interactions/${firstInteraction.id}`);
		}
	});
</script>

<div class="flex h-full items-center justify-center">
	<p class="text-sm text-muted-foreground">아이템 상호작용을 선택하세요</p>
</div>
