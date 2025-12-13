<script lang="ts">
	import '@xyflow/svelte/dist/base.css';
	import '$lib/styles/svelte-flow.css';
	import { setMode } from 'mode-watcher';
	import { onMount, onDestroy } from 'svelte';
	import type { Snippet } from 'svelte';
	import AdminProvider from '$lib/components/admin/admin-provider.svelte';
	import AdminSidebar from '$lib/components/admin/sidebar/admin-sidebar.svelte';
	import AdminSiteHeader from '$lib/components/admin/sidebar/admin-site-header.svelte';
	import ScenarioCreateDialog from '$lib/components/admin/sidebar/scenario-create-dialog.svelte';
	import ScenarioUpdateDialog from '$lib/components/admin/sidebar/scenario-update-dialog.svelte';
	import ScenarioDeleteDialog from '$lib/components/admin/sidebar/scenario-delete-dialog.svelte';
	import { SidebarProvider, SidebarInset } from '$lib/components/ui/sidebar';

	const { children }: { children: Snippet } = $props();

	onMount(() => {
		setMode('dark');
	});

	onDestroy(() => {
		setMode('light');
	});
</script>

<AdminProvider>
	<div class="[--header-height:--spacing(16)]">
		<SidebarProvider class="flex flex-col">
			<AdminSiteHeader />
			<div class="flex flex-1">
				<AdminSidebar />
				<SidebarInset>
					{@render children()}
				</SidebarInset>
			</div>
		</SidebarProvider>
	</div>
	<ScenarioCreateDialog />
	<ScenarioUpdateDialog />
	<ScenarioDeleteDialog />
</AdminProvider>
