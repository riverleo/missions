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
	import type { ScenarioId } from '$lib/types';

	interface MenuItem {
		title: string;
		href?: string;
		subItems?: MenuItem[];
	}

	interface MenuGroup {
		label: string;
		items: MenuItem[];
	}

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const menuGroups = $derived<MenuGroup[]>([
		{
			label: '시나리오',
			items: [
				{ title: '챕터', href: `/admin/scenarios/${scenarioId}/chapters` },
				{ title: '퀘스트', href: `/admin/scenarios/${scenarioId}/quests` },
				{ title: '대화 또는 효과', href: `/admin/scenarios/${scenarioId}/narratives` },
			],
		},
		{
			label: '월드',
			items: [
				{
					title: '지형',
					subItems: [
						{ title: '생성 및 관리', href: `/admin/scenarios/${scenarioId}/terrains` },
						{ title: '타일', href: `/admin/scenarios/${scenarioId}/tiles` },
						{ title: '지형과 타일 연결', href: `/admin/scenarios/${scenarioId}/terrains-tiles` },
					],
				},
				{
					title: '캐릭터',
					subItems: [
						{ title: '바디', href: `/admin/scenarios/${scenarioId}/character-bodies` },
						{ title: '생성 및 관리', href: `/admin/scenarios/${scenarioId}/characters` },
						{ title: '상호작용', href: `/admin/scenarios/${scenarioId}/character-interactions` },
						{ title: '욕구', href: `/admin/scenarios/${scenarioId}/needs` },
					],
				},
				{
					title: '건물',
					subItems: [
						{ title: '생성 및 관리', href: `/admin/scenarios/${scenarioId}/buildings` },
						{ title: '상호작용', href: `/admin/scenarios/${scenarioId}/building-interactions` },
						{ title: '컨디션', href: `/admin/scenarios/${scenarioId}/conditions` },
					],
				},
				{
					title: '아이템',
					subItems: [
						{ title: '생성 및 관리', href: `/admin/scenarios/${scenarioId}/items` },
						{ title: '상호작용', href: `/admin/scenarios/${scenarioId}/item-interactions` },
					],
				},
				{
					title: '행동',
					subItems: [
						{ title: '우선도', href: `/admin/scenarios/${scenarioId}/behavior-priorities` },
						{ title: '욕구 행동', href: `/admin/scenarios/${scenarioId}/need-behaviors` },
						{ title: '컨디션 행동', href: `/admin/scenarios/${scenarioId}/condition-behaviors` },
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
