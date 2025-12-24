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
	import { useBuildingBehavior } from '$lib/hooks/use-building-behavior';
	import { useBuilding } from '$lib/hooks/use-building';
	import { page } from '$app/state';
	import { alphabetical, group } from 'radash';
	import { getBuildingBehaviorTypeLabel } from '$lib/utils/state-label';
	import type { ScenarioId } from '$lib/types';

	const { buildingBehaviorStore, openDialog } = useBuildingBehavior();
	const { store: buildingStore } = useBuilding();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentBehaviorId = $derived(page.params.behaviorId);

	const behaviorsGroupedByBuilding = $derived(() => {
		const behaviors = Object.values($buildingBehaviorStore.data);
		const grouped = group(behaviors, (b) => b.building_id);
		const buildings = Object.values($buildingStore.data);
		const sortedBuildings = alphabetical(buildings, (b) => b.name);

		return sortedBuildings
			.map((building) => ({
				building,
				behaviors: alphabetical(grouped[building.id] ?? [], (b) => b.type),
			}))
			.filter((g) => g.behaviors.length > 0);
	});
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="건물 행동 검색..." />
	{#if behaviorsGroupedByBuilding().length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			{#each behaviorsGroupedByBuilding() as { building, behaviors } (building.id)}
				<CommandGroup heading={building.name}>
					{#each behaviors as behavior (behavior.id)}
						<CommandLinkItem
							href={`/admin/scenarios/${scenarioId}/building-behaviors/${behavior.id}`}
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
									"{building.name}" 건물을 "{getBuildingBehaviorTypeLabel(behavior.type)}"
								</span>
								{#if behavior.description}
									<span class="truncate text-xs text-muted-foreground">
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
