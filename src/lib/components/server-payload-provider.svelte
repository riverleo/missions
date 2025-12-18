<script lang="ts">
	import type { ServerPayload } from '$lib/types';
	import type { Snippet } from 'svelte';
	import { setServerPayloadContext } from '$lib/hooks/use-server-payload.svelte';

	const { data, children }: { data: ServerPayload; children: Snippet } = $props();

	setServerPayloadContext(data);
</script>

{@render children()}
