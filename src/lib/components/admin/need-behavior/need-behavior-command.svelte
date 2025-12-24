<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Command,
		CommandInput,
		CommandList,
		CommandEmpty,
		CommandGroup,
		CommandLinkItem,
	} from '$lib/components/ui/command';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from '$lib/components/ui/dropdown-menu';
	import { IconCheck, IconDotsVertical } from '@tabler/icons-svelte';
	import { cn } from '$lib/utils';
	import { useNeedBehavior } from '$lib/hooks/use-need-behavior';
	import { useNeed } from '$lib/hooks/use-need';
	import { page } from '$app/state';
	import { alphabetical, group } from 'radash';
	import type { ScenarioId } from '$lib/types';

	const { needBehaviorStore, openDialog } = useNeedBehavior();
	const { needStore } = useNeed();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentBehaviorId = $derived(page.params.behaviorId);

	const behaviorsGroupedByNeed = $derived(() => {
		const behaviors = Object.values($needBehaviorStore.data);
		const grouped = group(behaviors, (b) => b.need_id);
		const needs = Object.values($needStore.data);
		const sortedNeeds = alphabetical(needs, (n) => n.name);

		return sortedNeeds
			.map((need) => ({
				need,
				behaviors: alphabetical(grouped[need.id] ?? [], (b) => b.name),
			}))
			.filter((g) => g.behaviors.length > 0);
	});
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="행동 검색..." />
	{#if behaviorsGroupedByNeed().length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			{#each behaviorsGroupedByNeed() as { need, behaviors } (need.id)}
				<CommandGroup heading={need.name}>
					{#each behaviors as behavior (behavior.id)}
						<CommandLinkItem
							href={`/admin/scenarios/${scenarioId}/behaviors/${behavior.id}`}
							class="group pr-1"
						>
							<IconCheck
								class={cn(
									'mr-2 size-4',
									behavior.id === currentBehaviorId ? 'opacity-100' : 'opacity-0'
								)}
							/>
							<div class="flex flex-1 flex-col truncate">
								<span class="truncate">
									{behavior.name || `이름없음 (${behavior.id.split('-')[0]})`}
								</span>
								<span class="truncate text-xs text-muted-foreground">
									{need.name}
									{behavior.need_threshold} 이하
								</span>
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger>
									{#snippet child({ props })}
										<Button
											{...props}
											variant="ghost"
											size="icon"
											class="size-6 group-hover:opacity-100"
											onclick={(e) => e.preventDefault()}
										>
											<IconDotsVertical class="size-4" />
										</Button>
									{/snippet}
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										onclick={() => openDialog({ type: 'update', behaviorId: behavior.id })}
									>
										수정
									</DropdownMenuItem>
									<DropdownMenuItem
										onclick={() => openDialog({ type: 'delete', behaviorId: behavior.id })}
									>
										삭제
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</CommandLinkItem>
					{/each}
				</CommandGroup>
			{/each}
		</CommandList>
	{/if}
</Command>
