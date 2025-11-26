<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import AppSidebar from '$lib/components/app/sidebar/app-sidebar.svelte';
	import { NewQuest } from '$lib/components/app/quest';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { onkeydown, onkeyup, onmousedown, onmouseup } from '$lib/shortcut/events';
	import DialogNode from '$lib/components/app/dialog-node/dialog-node.svelte';

	injectSpeedInsights();
	injectAnalytics();

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<svelte:window {onkeydown} {onkeyup} {onmousedown} {onmouseup} />

<AppSidebar open={data.sidebarCookieState}>
	{@render children()}
</AppSidebar>

<NewQuest />
<DialogNode />
