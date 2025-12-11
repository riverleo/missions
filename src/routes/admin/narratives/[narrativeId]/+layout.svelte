<script lang="ts">
	import { onMount } from 'svelte';
	import NarrativeSiteHeaderActions from '$lib/components/admin/narrative/narrative-site-header-actions.svelte';
	import { useAdmin } from '$lib/hooks/use-admin.svelte';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import { page } from '$app/stores';

	let { children } = $props();

	const admin = useAdmin();
	const { store } = useNarrative();
	const narrativeId = $derived($page.params.narrativeId);
	const currentNarrative = $derived($store.data?.find((n) => n.id === narrativeId));

	$effect(() => {
		if (currentNarrative) {
			admin.breadcrumbTitle = currentNarrative.title;
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

{@render children()}
