<script lang="ts">
	import type { ItemBehaviorId, ItemBehaviorActionId } from '$lib/types';
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
	import { useItemBehavior } from '$lib/hooks/use-item-behavior';
	import { useItem } from '$lib/hooks/use-item';
	import { page } from '$app/state';
	import { alphabetical, group } from 'radash';
	import { getItemBehaviorTypeLabel } from '$lib/utils/state-label';
	import type { ScenarioId } from '$lib/types';

	const { itemBehaviorStore, openDialog } = useItemBehavior();
	const { store: itemStore } = useItem();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentBehaviorId = $derived(page.params.behaviorId);

	const behaviorsGroupedByItem = $derived(() => {
		const behaviors = Object.values($itemBehaviorStore.data);
		const grouped = group(behaviors, (b) => b.item_id);
		const items = Object.values($itemStore.data);
		const sortedItems = alphabetical(items, (i) => i.name);

		return sortedItems
			.map((item) => ({
				item,
				behaviors: alphabetical(grouped[item.id] ?? [], (b) => b.type),
			}))
			.filter((g) => g.behaviors.length > 0);
	});
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="아이템 행동 검색..." />
	{#if behaviorsGroupedByItem().length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			{#each behaviorsGroupedByItem() as { item, behaviors } (item.id)}
				<CommandGroup heading={item.name}>
					{#each behaviors as behavior (behavior.id)}
						<CommandLinkItem
							href={`/admin/scenarios/${scenarioId}/item-behaviors/${behavior.id}`}
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
									"{item.name}" 아이템을 "{getItemBehaviorTypeLabel(behavior.type)}"
								</span>
								{#if behavior.description}
									<span class="text-muted-foreground text-xs truncate">
										{behavior.description}
									</span>
								{/if}
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
