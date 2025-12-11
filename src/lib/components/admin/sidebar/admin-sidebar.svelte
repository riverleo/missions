<script lang="ts">
	import { page } from '$app/stores';
	import { IconBook, IconSword } from '@tabler/icons-svelte';
	import {
		Sidebar,
		SidebarContent,
		SidebarGroup,
		SidebarGroupContent,
		SidebarGroupLabel,
		SidebarHeader,
		SidebarMenu,
		SidebarMenuItem,
		SidebarMenuButton,
	} from '$lib/components/ui/sidebar';
	import type { ComponentProps } from 'svelte';

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
	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar> = $props();
	function isActive(href: string) {
		return $page.url.pathname.startsWith(href);
	}
</script>

<Sidebar class="top-(--header-height) h-[calc(100svh-var(--header-height))]!" {...restProps}>
	<SidebarHeader>
		<h1 class="px-2 text-lg font-semibold">관리자</h1>
	</SidebarHeader>
	<SidebarContent>
		<SidebarGroup>
			<SidebarGroupLabel>메뉴</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{#each menuItems as item}
						<SidebarMenuItem>
							<SidebarMenuButton isActive={isActive(item.href)}>
								{#snippet child({ props })}
									<a href={item.href} {...props}>
										<item.icon />
										<span>{item.title}</span>
									</a>
								{/snippet}
							</SidebarMenuButton>
						</SidebarMenuItem>
					{/each}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	</SidebarContent>
</Sidebar>
