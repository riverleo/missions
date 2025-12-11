<script lang="ts">
	import { onMount } from 'svelte';
	import QuestSiteHeaderActions from '$lib/components/admin/quest/quest-site-header-actions.svelte';
	import { useAdmin } from '$lib/hooks/use-admin.svelte';

	let { children } = $props();

	const admin = useAdmin();

	onMount(() => {
		admin.siteHeaderActions = actionButtons;
		return () => {
			admin.siteHeaderActions = undefined;
		};
	});
</script>

{#snippet actionButtons()}
	<QuestSiteHeaderActions />
{/snippet}

{@render children()}
