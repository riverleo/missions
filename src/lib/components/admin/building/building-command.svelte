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
	import { useBuilding } from '$lib/hooks/use-building';
	import { page } from '$app/state';
	import { alphabetical } from 'radash';
	import type { ScenarioId } from '$lib/types';

	const { buildingStore, openBuildingDialog } = useBuilding();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentBuildingId = $derived(page.params.buildingId);

	const buildings = $derived(alphabetical(Object.values($buildingStore.data), (b) => b.name));
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="건물 검색..." />
	{#if buildings.length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			<CommandGroup>
				{#each buildings as building (building.id)}
					<CommandLinkItem
						href={`/admin/scenarios/${scenarioId}/buildings/${building.id}`}
						class="group pr-1"
					>
						<IconCheck
							class={cn(
								'mr-2 size-4',
								building.id === currentBuildingId ? 'opacity-100' : 'opacity-0'
							)}
						/>
						<span class="flex-1 truncate">
							{building.name || `이름없음 (${building.id.split('-')[0]})`}
						</span>
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
									onclick={() => openBuildingDialog({ type: 'update', buildingId: building.id })}
								>
									수정
								</DropdownMenuItem>
								<DropdownMenuItem
									onclick={() => openBuildingDialog({ type: 'delete', buildingId: building.id })}
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
