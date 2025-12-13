<script lang="ts">
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
	import { useScenario } from '$lib/hooks/use-scenario.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	const { store, fetch, init, openDialog } = useScenario();

	const scenarios = $derived($store.data ?? []);
	const currentScenarioId = $derived($store.currentScenarioId);
	const currentScenario = $derived(scenarios.find((s) => s.id === currentScenarioId));

	onMount(() => {
		fetch();
	});

	function onselect(scenarioId: string) {
		if (scenarioId !== currentScenarioId) {
			init(scenarioId);
			goto(`/admin/scenarios/${scenarioId}/quests`);
		}
	}

	function onclickCreate() {
		openDialog({ type: 'create' });
	}

	function onclickUpdate(scenarioId: string) {
		openDialog({ type: 'update', scenarioId });
	}

	function onclickDelete(scenarioId: string) {
		openDialog({ type: 'delete', scenarioId });
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
							{#if currentScenario?.created_by?.display_name}
								<span class="truncate text-xs text-muted-foreground">
									{currentScenario.created_by.display_name}
								</span>
							{/if}
						</div>
						<IconSelector class="ml-auto size-4" />
					</SidebarMenuButton>
				{/snippet}
			</DropdownMenuTrigger>
			<DropdownMenuContent class="min-w-[var(--bits-floating-anchor-width)]" align="start">
				{#each scenarios as scenario (scenario.id)}
					<DropdownMenuSub>
						<DropdownMenuSubTrigger onclick={() => onselect(scenario.id)}>
							<IconCheck
								class="mr-2 size-4 {scenario.id === currentScenarioId ? 'opacity-100' : 'opacity-0'}"
							/>
							{scenario.title}
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuItem onclick={() => onclickUpdate(scenario.id)}>
								수정
							</DropdownMenuItem>
							<DropdownMenuItem onclick={() => onclickDelete(scenario.id)}>
								삭제
							</DropdownMenuItem>
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
