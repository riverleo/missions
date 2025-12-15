<script lang="ts">
	import { page } from '$app/state';
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
	import ScenarioSwitcher from './scenario-switcher.svelte';

	const scenarioId = $derived(page.params.scenarioId);

	const scenarioMenuItems = $derived([
		{
			title: '챕터',
			href: scenarioId ? `/admin/scenarios/${scenarioId}/chapters` : undefined,
		},
		{
			title: '퀘스트',
			href: scenarioId ? `/admin/scenarios/${scenarioId}/quests` : undefined,
		},
		{
			title: '대화 또는 효과',
			href: scenarioId ? `/admin/scenarios/${scenarioId}/narratives` : undefined,
		},
	]);

	const gameElementMenuItems = $derived([
		{
			title: '테스트',
			href: scenarioId ? `/admin/scenarios/${scenarioId}/play` : undefined,
		},
		{
			title: '지형',
			href: scenarioId ? `/admin/scenarios/${scenarioId}/terrains` : undefined,
		},
		{
			title: '캐릭터',
			href: scenarioId ? `/admin/scenarios/${scenarioId}/characters` : undefined,
		},
		{
			title: '아이템',
			href: scenarioId ? `/admin/scenarios/${scenarioId}/items` : undefined,
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
			<SidebarGroupLabel>시나리오</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{#each scenarioMenuItems as item}
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
		<SidebarGroup>
			<SidebarGroupLabel>세계</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{#each gameElementMenuItems as item}
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
