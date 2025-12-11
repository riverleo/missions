<script lang="ts">
	import { page } from '$app/stores';
	import { IconBook, IconSword } from '@tabler/icons-svelte';

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
</script>

<aside class="flex h-screen w-64 flex-col border-r bg-background">
	<div class="border-b p-6">
		<h1 class="text-xl font-bold">관리자</h1>
	</div>

	<nav class="flex-1 space-y-1 p-4">
		{#each menuItems as item}
			<a
				href={item.href}
				class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
				class:bg-accent={isActive(item.href)}
				class:text-accent-foreground={isActive(item.href)}
			>
				<svelte:component this={item.icon} class="h-5 w-5" />
				<span>{item.title}</span>
			</a>
		{/each}
	</nav>
</aside>
