<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import AppSidebar from '$lib/components/app-sidebar/app-sidebar.svelte';
	import { wasLoggedIn } from '$lib/stores';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { shortcut } from '@svelte-put/shortcut';
	import { onshortcut } from '$lib/shortcut';

	injectSpeedInsights();

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<svelte:window use:shortcut={{ trigger: { key: 'q', modifier: false } }} {onshortcut} />

<ModeWatcher />

{#if $wasLoggedIn}
	<AppSidebar open={data.sidebarCookieState}>
		{@render children()}
	</AppSidebar>
{:else}
	{@render children()}
{/if}
