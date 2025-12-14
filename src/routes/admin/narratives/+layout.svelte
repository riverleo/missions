<script lang="ts">
	import { onMount } from 'svelte';
	import NarrativeAside from '$lib/components/admin/narrative/narrative-aside.svelte';
	import { useAdmin } from '$lib/hooks/use-admin.svelte';
	import { useNarrative } from '$lib/hooks/use-narrative';
	import { page } from '$app/state';

	let { children } = $props();

	const admin = useAdmin();
	const { narrativeStore } = useNarrative();
	const narrativeId = $derived(page.params.narrativeId);
	const currentNarrative = $derived(narrativeId ? $narrativeStore.data?.[narrativeId] : undefined);

	$effect(() => {
		if (currentNarrative) {
			admin.breadcrumbTitle = currentNarrative.title;
		} else {
			admin.breadcrumbTitle = undefined;
		}
	});

	onMount(() => {
		return () => {
			admin.breadcrumbTitle = undefined;
		};
	});
</script>

<div class="relative h-full">
	<NarrativeAside />
	{@render children()}
</div>
