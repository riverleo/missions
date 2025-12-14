<script lang="ts">
	import { page } from '$app/state';
	import {
		Sidebar,
		SidebarContent,
		SidebarGroup,
		SidebarGroupContent,
		SidebarHeader,
		SidebarMenu,
		SidebarMenuItem,
		SidebarMenuButton,
	} from '$lib/components/ui/sidebar';
	import type { ComponentProps } from 'svelte';
	import ScenarioSwitcher from './scenario-switcher.svelte';
	import { useScenario } from '$lib/hooks/use-scenario';

	const { store } = useScenario();
	const currentScenarioId = $derived($store.currentScenarioId);

	const menuItems = $derived([
		{
			title: '챕터',
			href: currentScenarioId ? `/admin/scenarios/${currentScenarioId}/chapters` : undefined,
		},
		{
			title: '퀘스트',
			href: currentScenarioId ? `/admin/scenarios/${currentScenarioId}/quests` : undefined,
		},
		{
			title: '대화 또는 효과',
			href: '/admin/narratives',
		},
	]);

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar> = $props();

	function isActive(href: string | undefined) {
		if (!href) return false;
		return page.url.pathname.startsWith(href);
	}
</script>

<Sidebar class="top-(--header-height) h-[calc(100svh-var(--header-height))]!" {...restProps}>
	<SidebarHeader>
		<ScenarioSwitcher />
	</SidebarHeader>
	<SidebarContent>
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					{#each menuItems as item}
						{#if item.href}
							<SidebarMenuItem>
								<SidebarMenuButton isActive={isActive(item.href)}>
									{#snippet child({ props })}
										<a href={item.href} {...props}>
											<span>{item.title}</span>
										</a>
									{/snippet}
								</SidebarMenuButton>
							</SidebarMenuItem>
						{/if}
					{/each}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	</SidebarContent>
</Sidebar>
