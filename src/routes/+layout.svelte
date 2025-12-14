<script lang="ts">
	import '$lib/styles/app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onkeydown, onkeyup, onmousedown, onmouseup, onmouseover } from '$lib/shortcut/events';
	import ServerPayloadProvider from '$lib/components/server-payload-provider.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import type { ServerPayload } from '$lib/types';
	import { TooltipProvider } from '$lib/components/ui/tooltip';
	import Narrative from '$lib/components/app/narrative-play/narrative.svelte';
	import DiceRoll from '$lib/components/app/dice-roll-play/dice-roll.svelte';

	const { data, children }: { data: ServerPayload; children: any } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<svelte:window {onkeydown} {onkeyup} {onmousedown} {onmouseup} {onmouseover} />

<ModeWatcher />

<ServerPayloadProvider {data}>
	<TooltipProvider>
		{@render children()}
	</TooltipProvider>
	<Narrative />
	<DiceRoll />
</ServerPayloadProvider>
