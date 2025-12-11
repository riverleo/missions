<script lang="ts">
	import { page } from '$app/stores';
	import {
		IconBook,
		IconSword,
		IconChevronRight,
		IconMenu2,
		IconX,
	} from '@tabler/icons-svelte';
	import { Button } from '$lib/components/ui/button';

	let isCollapsed = $state(false);

	const menuItems = [
		{
			title: '퀘스트',
			href: '/admin/quests',
			icon: IconSword,
		},
		{
			title: '내러티브',
			href: '/admin/narratives',
			icon: IconBook,
		},
	];

	function isActive(href: string) {
		return $page.url.pathname.startsWith(href);
	}

	function toggleSidebar() {
		isCollapsed = !isCollapsed;
	}
</script>

<aside
	class="group relative flex h-screen w-64 flex-col border-r bg-sidebar transition-all duration-300 data-[collapsed=true]:w-16"
	data-collapsed={isCollapsed}
>
	<!-- Header -->
	<div class="flex h-16 items-center justify-between border-b px-4">
		{#if !isCollapsed}
			<h1 class="text-lg font-semibold text-sidebar-foreground">관리자</h1>
		{/if}
		<Button
			variant="ghost"
			size="icon"
			onclick={toggleSidebar}
			class="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
		>
			{#if isCollapsed}
				<IconMenu2 class="h-4 w-4" />
			{:else}
				<IconX class="h-4 w-4" />
			{/if}
		</Button>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 space-y-1 p-2">
		{#each menuItems as item}
			<a
				href={item.href}
				class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
				class:bg-sidebar-accent={isActive(item.href)}
				class:text-sidebar-accent-foreground={isActive(item.href)}
				title={isCollapsed ? item.title : undefined}
			>
				<svelte:component this={item.icon} class="h-5 w-5 shrink-0" />
				{#if !isCollapsed}
					<span class="truncate">{item.title}</span>
				{/if}
			</a>
		{/each}
	</nav>
</aside>
