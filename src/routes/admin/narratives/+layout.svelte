<script lang="ts">
	import { onMount } from 'svelte';
	import NarrativeAside from '$lib/components/admin/narrative/narrative-aside.svelte';
	import NarrativeSiteHeaderActions from '$lib/components/admin/narrative/narrative-site-header-actions.svelte';
	import { useAdmin } from '$lib/hooks/use-admin.svelte';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import { page } from '$app/state';

	let { children } = $props();

	const admin = useAdmin();
	const { store } = useNarrative();
	const narrativeId = $derived(page.params.narrativeId);
	const currentNarrative = $derived($store.data?.find((n) => n.id === narrativeId));

	$effect(() => {
		if (currentNarrative) {
			admin.breadcrumbTitle = currentNarrative.title;
		} else {
			admin.breadcrumbTitle = undefined;
		}
	});

	onMount(() => {
		admin.siteHeaderActions = siteHeaderActions;

		return () => {
			admin.siteHeaderActions = undefined;
			admin.breadcrumbTitle = undefined;
		};
	});
</script>

{#snippet siteHeaderActions()}
	<NarrativeSiteHeaderActions />
{/snippet}

<div class="relative h-full">
	<NarrativeAside />
	{@render children()}
</div>
