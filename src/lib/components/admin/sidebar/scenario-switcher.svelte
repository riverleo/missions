<script lang="ts">
	import { useScenario } from '$lib/hooks';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuSub,
		DropdownMenuSubContent,
		DropdownMenuSubTrigger,
		DropdownMenuTrigger,
	} from '$lib/components/ui/dropdown-menu';
	import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '$lib/components/ui/sidebar';
	import { IconSelector, IconCheck, IconPlus } from '@tabler/icons-svelte';
	import type { ScenarioId } from '$lib/types';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	const { scenarioStore, fetch, openScenarioDialog, } = useScenario();

	const scenarios = $derived(Object.values($scenarioStore.data));
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentScenario = $derived(scenarioId ? $scenarioStore.data[scenarioId] : undefined);

	onMount(() => {
		fetch();
	});

	function onselect(targetScenarioId: ScenarioId) {
		if (targetScenarioId !== scenarioId) {
			goto(`/admin/scenarios/${targetScenarioId}/quests`);
		}
	}

	function onclickCreate() {
		openScenarioDialog({ type: 'create' });
	}

	function onclickUpdate(scenarioId: ScenarioId) {
		openScenarioDialog({ type: 'update', scenarioId });
	}

	function onclickDelete(scenarioId: ScenarioId) {
		openScenarioDialog({ type: 'delete', scenarioId });
	}

	function onclickPublish(scenarioId: ScenarioId) {
		openScenarioDialog({ type: 'publish', scenarioId });
	}
</script>

<SidebarMenu>
	<SidebarMenuItem>
		<DropdownMenu>
			<DropdownMenuTrigger>
				{#snippet child({ props })}
					<SidebarMenuButton
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						{...props}
					>
						<Avatar class="size-8 rounded-lg">
							<AvatarFallback class="rounded-lg">
								{currentScenario?.title?.charAt(0) ?? 'S'}
							</AvatarFallback>
						</Avatar>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-semibold">
								{currentScenario?.title ?? '시나리오 선택'}
							</span>
							{#if currentScenario}
								<span class="truncate text-xs text-muted-foreground">
									{currentScenario.status === 'published' ? '공개됨' : '작업중'}
								</span>
							{/if}
						</div>
						<IconSelector class="ml-auto size-4" />
					</SidebarMenuButton>
				{/snippet}
			</DropdownMenuTrigger>
			<DropdownMenuContent class="min-w-(--bits-floating-anchor-width)" align="start">
				{#each scenarios as scenario (scenario.id)}
					<DropdownMenuSub>
						<DropdownMenuSubTrigger onclick={() => onselect(scenario.id)}>
							<IconCheck
								class="mr-2 size-4 {scenario.id === scenarioId ? 'opacity-100' : 'opacity-0'}"
							/>
							{scenario.title}
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuItem onclick={() => onclickUpdate(scenario.id)}>수정</DropdownMenuItem>
							<DropdownMenuItem onclick={() => onclickPublish(scenario.id)}>
								{scenario.status === 'published' ? '작업중으로 전환' : '공개로 전환'}
							</DropdownMenuItem>
							<DropdownMenuItem onclick={() => onclickDelete(scenario.id)}>삭제</DropdownMenuItem>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				{/each}
				<DropdownMenuSeparator />
				<DropdownMenuItem onclick={onclickCreate}>
					<IconPlus class="mr-2 size-4" />
					시나리오 추가
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	</SidebarMenuItem>
</SidebarMenu>
