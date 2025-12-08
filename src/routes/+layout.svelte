<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onkeydown, onkeyup, onmousedown, onmouseup, onmouseover } from '$lib/shortcut/events';
	import ServerPayloadProvider from '$lib/components/server-payload-provider.svelte';
	import type { ServerPayload } from '$lib/types/fetch';

	const { data, children }: { data: ServerPayload; children: any } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<svelte:window {onkeydown} {onkeyup} {onmousedown} {onmouseup} {onmouseover} />

<ServerPayloadProvider {data}>
	{@render children()}
</ServerPayloadProvider>
