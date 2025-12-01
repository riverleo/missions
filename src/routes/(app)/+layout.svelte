<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import AppSidebar from '$lib/components/app/sidebar/app-sidebar.svelte';
	import { NewQuest } from '$lib/components/app/quest';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import Narrative from '$lib/components/app/narrative/narrative.svelte';

	injectSpeedInsights();
	injectAnalytics();

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<AppSidebar open={data.sidebarCookieState}>
	{@render children()}
</AppSidebar>

<NewQuest />
<Narrative />
