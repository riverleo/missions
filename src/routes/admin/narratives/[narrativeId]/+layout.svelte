<script lang="ts">
	import { onMount } from 'svelte';
	import NarrativeSiteHeaderActions from '$lib/components/admin/narrative/narrative-site-header-actions.svelte';
	import { useAdmin } from '$lib/hooks/use-admin.svelte';

	let { children } = $props();

	const admin = useAdmin();

	onMount(() => {
		admin.siteHeaderActions = siteHeaderActions;

		return () => (admin.siteHeaderActions = undefined);
	});
</script>

{#snippet siteHeaderActions()}
	<NarrativeSiteHeaderActions />
{/snippet}

{@render children()}
