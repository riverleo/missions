<script lang="ts">
	import { page } from '$app/state';
	import {
		Sidebar,
		SidebarContent,
		SidebarGroup,
		SidebarGroupContent,
		SidebarMenu,
		SidebarMenuItem,
		SidebarMenuButton,
	} from '$lib/components/ui/sidebar';
	import type { ComponentProps } from 'svelte';

	const menuItems = [
		{
			title: '퀘스트',
			href: '/admin/quests',
		},
		{
			title: '대화 또는 효과',
			href: '/admin/narratives',
		},
	];
	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar> = $props();
	function isActive(href: string) {
		return page.url.pathname.startsWith(href);
	}
</script>

<Sidebar class="top-(--header-height) h-[calc(100svh-var(--header-height))]!" {...restProps}>
	<SidebarContent>
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					{#each menuItems as item}
						<SidebarMenuItem>
							<SidebarMenuButton isActive={isActive(item.href)}>
								{#snippet child({ props })}
									<a href={item.href} {...props}>
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
