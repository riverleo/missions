<script lang="ts">
	import { setContext } from 'svelte';
	import type { ServerPayload } from '$lib/types/fetch';
	import type { Snippet } from 'svelte';

	const { data, children }: { data: ServerPayload; children: Snippet } = $props();

	setContext('serverPayload', data);
</script>

{@render children()}
