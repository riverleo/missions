<script lang="ts">
	import '$lib/styles/app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onkeydown, onkeyup, onmousedown, onmouseup, onmouseover } from '$lib/shortcut/events';
	import AppProvider from '$lib/components/app-provider.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import type { AppPayload } from '$lib/types';
	import { TooltipProvider } from '$lib/components/ui/tooltip';
	import NarrativeNodePlay from '$lib/components/app/narrative-node-play/narrative-node-play.svelte';

	const { data, children }: { data: AppPayload; children: any } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<svelte:window {onkeydown} {onkeyup} {onmousedown} {onmouseup} {onmouseover} />

<ModeWatcher />

<AppProvider {data}>
	<TooltipProvider>
		{@render children()}

		<NarrativeNodePlay />
	</TooltipProvider>
</AppProvider>
