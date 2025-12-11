<script lang="ts">
	import { setMode } from 'mode-watcher';
	import { onMount, onDestroy } from 'svelte';
	import type { Snippet } from 'svelte';
	import AdminSidebar from '$lib/components/admin/sidebar/admin-sidebar.svelte';
	import AdminHeader from '$lib/components/admin/sidebar/admin-site-header.svelte';
	import { SidebarProvider, SidebarInset } from '$lib/components/ui/sidebar';

	const { children }: { children: Snippet } = $props();

	onMount(() => {
		setMode('dark');
	});

	onDestroy(() => {
		setMode('light');
	});
</script>

<div class="[--header-height:theme(spacing.16)]">
	<SidebarProvider class="flex flex-col">
		<AdminHeader />
		<div class="flex flex-1">
			<AdminSidebar />
			<SidebarInset>
				{@render children()}
			</SidebarInset>
		</div>
	</SidebarProvider>
</div>
