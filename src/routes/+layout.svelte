<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import Sidebar from '$lib/components/SidebarClaude.svelte';
	import { wasLoggedIn } from '$lib/stores';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	injectSpeedInsights();

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />

{#if $wasLoggedIn}
	<Sidebar open={data.sidebarCookieState}>
		{@render children()}
	</Sidebar>
{:else}
	{@render children()}
{/if}
