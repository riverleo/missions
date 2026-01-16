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
	import ScenarioPublishDialog from '$lib/components/admin/sidebar/scenario-publish-dialog.svelte';
	import { SidebarProvider, SidebarInset } from '$lib/components/ui/sidebar';
	import { useCurrent } from '$lib/hooks/use-current';
	import { TEST_PLAYER_ID } from '$lib/constants';

	const { children }: { children: Snippet } = $props();
	const { selectPlayer } = useCurrent();

	onMount(() => {
		setMode('dark');
		// 테스트 플레이어 자동 선택 (테스트 월드 사용을 위해)
		selectPlayer(TEST_PLAYER_ID);
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
	<ScenarioPublishDialog />
</AdminProvider>
