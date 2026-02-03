<script lang="ts">
	import { useItem } from '$lib/hooks';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId } from '$lib/types';

	const { itemStore } = useItem();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const items = $derived(Object.values($itemStore.data));

	$effect(() => {
		if (items.length > 0) {
			const firstItem = items[0]!;
			goto(`/admin/scenarios/${scenarioId}/items/${firstItem.id}`);
		}
	});
</script>

<div class="flex h-full items-center justify-center">
	{#if items.length === 0}
		<p class="text-sm text-muted-foreground">아이템을 추가해주세요</p>
	{:else}
		<p class="text-sm text-muted-foreground">아이템을 선택해주세요</p>
	{/if}
</div>
