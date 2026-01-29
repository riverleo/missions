<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useCharacter } from '$lib/hooks/use-character';
	import type { ScenarioId } from '$lib/types';

	const { characterBodyStore } = useCharacter();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const bodies = $derived(Object.values($characterBodyStore.data));

	$effect(() => {
		if (bodies.length > 0) {
			const firstBody = bodies[0]!;
			goto(`/admin/scenarios/${scenarioId}/character-bodies/${firstBody.id}`);
		}
	});
</script>

<div class="flex h-full items-center justify-center">
	{#if bodies.length === 0}
		<p class="text-sm text-muted-foreground">바디를 추가해주세요</p>
	{:else}
		<p class="text-sm text-muted-foreground">바디를 선택해주세요</p>
	{/if}
</div>
