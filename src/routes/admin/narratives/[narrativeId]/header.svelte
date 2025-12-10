<script lang="ts">
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import { page } from '$app/state';
	import NarrativeUpdateButton from './narrative-update-button.svelte';
	import NarrativeDeleteButton from './narrative-delete-button.svelte';

	const narrativeId = $derived(page.params.narrativeId);
	const { narratives } = useNarrative();

	const currentNarrative = $derived($narratives.data?.find((n) => n.id === narrativeId));
</script>

<header class="flex h-16 items-center justify-between border-b px-6">
	<h1 class="text-xl font-semibold">{currentNarrative?.title ?? '내러티브'}</h1>
	{#if narrativeId}
		<div class="flex gap-2">
			<NarrativeUpdateButton {narrativeId} />
			<NarrativeDeleteButton {narrativeId} />
		</div>
	{/if}
</header>
