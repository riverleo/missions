<script lang="ts">
	import { page } from '$app/state';
	import {
		Collapsible,
		CollapsibleContent,
		CollapsibleTrigger,
	} from '$lib/components/ui/collapsible';
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
		SidebarMenuSub,
		SidebarMenuSubButton,
		SidebarMenuSubItem,
	} from '$lib/components/ui/sidebar';
	import { IconChevronRight } from '@tabler/icons-svelte';
	import type { ComponentProps } from 'svelte';
	import ScenarioSwitcher from './scenario-switcher.svelte';

	interface MenuItem {
		title: string;
		href?: string;
		subItems?: MenuItem[];
	}

	interface MenuGroup {
		label: string;
		items: MenuItem[];
	}

	const scenarioId = $derived(page.params.scenarioId);

	const menuGroups = $derived<MenuGroup[]>([
		{
			label: '시나리오',
			items: [
				{ title: '챕터', href: scenarioId ? `/admin/scenarios/${scenarioId}/chapters` : undefined },
				{ title: '퀘스트', href: scenarioId ? `/admin/scenarios/${scenarioId}/quests` : undefined },
				{
					title: '대화 또는 효과',
					href: scenarioId ? `/admin/scenarios/${scenarioId}/narratives` : undefined,
				},
			],
		},
		{
			label: '세계',
			items: [
				{ title: '지형', href: scenarioId ? `/admin/scenarios/${scenarioId}/terrains` : undefined },
				{
					title: '캐릭터',
					subItems: [
						{
							title: '관리',
							href: scenarioId ? `/admin/scenarios/${scenarioId}/characters` : undefined,
						},
						{
							title: '바디',
							href: scenarioId ? `/admin/scenarios/${scenarioId}/character-bodies` : undefined,
						},
						{
							title: '욕구와 충족',
							href: scenarioId ? `/admin/scenarios/${scenarioId}/needs` : undefined,
						},
						{
							title: '행동',
							href: scenarioId ? `/admin/scenarios/${scenarioId}/behaviors` : undefined,
						},
					],
				},
				{
					title: '건물',
					subItems: [
						{
							title: '관리',
							href: scenarioId ? `/admin/scenarios/${scenarioId}/buildings` : undefined,
						},
						{
							title: '행동',
							href: scenarioId ? `/admin/scenarios/${scenarioId}/building-behaviors` : undefined,
						},
					],
				},
				{
					title: '아이템',
					subItems: [
						{
							title: '관리',
							href: scenarioId ? `/admin/scenarios/${scenarioId}/items` : undefined,
						},
						{
							title: '행동',
							href: scenarioId ? `/admin/scenarios/${scenarioId}/item-behaviors` : undefined,
						},
					],
				},
			],
		},
	]);

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar> = $props();

	const activeClass = 'data-[active=true]:bg-accent/40';

	function isActive(href: string | undefined) {
		if (!href) return false;
		return page.url.pathname.startsWith(href);
	}

	function isMenuOpen(item: MenuItem): boolean {
		if (isActive(item.href)) return true;
		return item.subItems?.some((subItem) => isActive(subItem.href)) ?? false;
	}
</script>

{#snippet menuItem(item: MenuItem)}
	{#if item.subItems && item.subItems.length > 0}
		<Collapsible open={isMenuOpen(item)} class="group/collapsible">
			<SidebarMenuItem>
				<CollapsibleTrigger>
					{#snippet child({ props })}
						<SidebarMenuButton {...props} class={activeClass} isActive={isActive(item.href)}>
							{#snippet child({ props: buttonProps })}
								{#if item.href}
									<a href={item.href} {...buttonProps}>
										<span>{item.title}</span>
										<IconChevronRight
											class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
										/>
									</a>
								{:else}
									<span {...buttonProps}>
										<span>{item.title}</span>
										<IconChevronRight
											class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
										/>
									</span>
								{/if}
							{/snippet}
						</SidebarMenuButton>
					{/snippet}
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						{#each item.subItems as subItem}
							{#if subItem.href}
								<SidebarMenuSubItem>
									<SidebarMenuSubButton class={activeClass} isActive={isActive(subItem.href)}>
										{#snippet child({ props })}
											<a href={subItem.href} {...props}>
												<span>{subItem.title}</span>
											</a>
										{/snippet}
									</SidebarMenuSubButton>
								</SidebarMenuSubItem>
							{/if}
						{/each}
					</SidebarMenuSub>
				</CollapsibleContent>
			</SidebarMenuItem>
		</Collapsible>
	{:else if item.href}
		<SidebarMenuItem>
			<SidebarMenuButton class={activeClass} isActive={isActive(item.href)}>
				{#snippet child({ props })}
					<a href={item.href} {...props}>
						<span>{item.title}</span>
					</a>
				{/snippet}
			</SidebarMenuButton>
		</SidebarMenuItem>
	{/if}
{/snippet}

<Sidebar class="top-(--header-height) h-[calc(100svh-var(--header-height))]!" {...restProps}>
	<SidebarHeader>
		<ScenarioSwitcher />
	</SidebarHeader>
	<SidebarContent>
		{#each menuGroups as group}
			<SidebarGroup>
				<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						{#each group.items as item}
							{@render menuItem(item)}
						{/each}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		{/each}
	</SidebarContent>
</Sidebar>
