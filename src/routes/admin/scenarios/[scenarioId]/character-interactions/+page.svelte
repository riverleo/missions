<script lang="ts">
	import { useInteraction } from '$lib/hooks';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId } from '$lib/types';

	const { characterInteractionStore } = useInteraction();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	$effect(() => {
		const interactions = Object.values($characterInteractionStore.data);
		if (interactions.length > 0) {
			const firstInteraction = interactions[0]!;
			goto(`/admin/scenarios/${scenarioId}/character-interactions/${firstInteraction.id}`);
		}
	});
</script>

<div class="flex h-full items-center justify-center">
	<p class="text-sm text-muted-foreground">캐릭터 상호작용을 선택하세요</p>
</div>
