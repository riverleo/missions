<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import AppSidebar from '$lib/components/app-sidebar/app-sidebar.svelte';
	import { NewQuest } from '$lib/components/quest';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { onkeyup, onkeydown, onmousedown, onmouseup, onmouseleave } from '$lib/shortcut/effects';

	injectSpeedInsights();

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<svelte:window {onkeyup} {onkeydown} {onmousedown} {onmouseup} {onmouseleave} />

<ModeWatcher />

<AppSidebar open={data.sidebarCookieState}>
	{@render children()}
</AppSidebar>

<NewQuest />
