<script lang="ts">
	import { setMode } from 'mode-watcher';
	import { onMount, onDestroy } from 'svelte';
	import type { Snippet } from 'svelte';
	import AdminSidebar from '$lib/components/admin/admin-sidebar.svelte';

	const { children }: { children: Snippet } = $props();

	onMount(() => {
		setMode('dark');
	});

	onDestroy(() => {
		setMode('light');
	});
</script>

<div class="flex h-screen">
	<AdminSidebar />
	<div class="flex flex-1 flex-col overflow-hidden">
		{@render children()}
	</div>
</div>
