<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount, onDestroy } from 'svelte';
	import { useAdmin } from '$lib/hooks/use-admin';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const { setMode } = useAdmin();

	onMount(() => setMode('admin'));
	onDestroy(() => setMode('player'));
</script>

{@render children()}
