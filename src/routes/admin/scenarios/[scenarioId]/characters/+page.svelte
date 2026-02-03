<script lang="ts">
	import { useCharacter } from '$lib/hooks';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId } from '$lib/types';

	const { characterStore } = useCharacter();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const characters = $derived(Object.values($characterStore.data));

	$effect(() => {
		if (characters.length > 0) {
			const firstCharacter = characters[0]!;
			goto(`/admin/scenarios/${scenarioId}/characters/${firstCharacter.id}`);
		}
	});
</script>

<div class="flex h-full items-center justify-center">
	{#if characters.length === 0}
		<p class="text-sm text-muted-foreground">캐릭터를 추가해주세요</p>
	{:else}
		<p class="text-sm text-muted-foreground">캐릭터를 선택해주세요</p>
	{/if}
</div>
