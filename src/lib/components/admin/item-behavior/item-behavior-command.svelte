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
	import { alphabetical } from 'radash';
	import type { ScenarioId } from '$lib/types';

	const { itemBehaviorStore, openDialog } = useItemBehavior();
	const { store: itemStore } = useItem();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentBehaviorId = $derived(page.params.behaviorId);

	const behaviors = $derived(() => {
		const behaviorList = Object.values($itemBehaviorStore.data);
		return alphabetical(behaviorList, (b) => {
			const item = $itemStore.data[b.item_id];
			return item?.name ?? '';
		});
	});
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="아이템 행동 검색..." />
	{#if behaviors().length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			<CommandGroup>
				{#each behaviors() as behavior (behavior.id)}
					{@const item = $itemStore.data[behavior.item_id]}
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
								"{item?.name}" 아이템 사용
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
		</CommandList>
	{/if}
</Command>
