<script lang="ts">
	import { setMode } from 'mode-watcher';
	import { onMount, onDestroy } from 'svelte';
	import type { Snippet } from 'svelte';

	const { children }: { children: Snippet } = $props();

	onMount(() => {
		setMode('dark');
	});

	onDestroy(() => {
		setMode('light');
	});
</script>

{@render children()}
