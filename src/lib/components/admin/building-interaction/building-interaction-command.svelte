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
	import { useCharacter } from '$lib/hooks/use-character';
	import { page } from '$app/state';
	import { alphabetical, group } from 'radash';
	import type { ScenarioId, BuildingId, CharacterId, BuildingInteraction } from '$lib/types';
	import { getBehaviorInteractTypeLabel } from '$lib/utils/state-label';

	const { buildingStore, buildingInteractionStore, openBuildingInteractionDialog } = useBuilding();
	const { characterStore } = useCharacter();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentInteractionId = $derived(page.params.buildingInteractionId);

	const interactionsGroupedByBuilding = $derived(() => {
		const interactions = Object.values($buildingInteractionStore.data);
		const grouped = group(interactions, (i) => i.building_id);
		const buildings = Object.values($buildingStore.data);
		const sortedBuildings = alphabetical(buildings, (b) => b.name);

		return sortedBuildings
			.map((building) => ({
				building,
				interactions: grouped[building.id] ?? [],
			}))
			.filter((g) => g.interactions.length > 0);
	});

	function getInteractionLabel(interaction: BuildingInteraction) {
		const character = interaction.character_id
			? $characterStore.data[interaction.character_id as CharacterId]
			: undefined;

		const behaviorLabel = getBehaviorInteractTypeLabel(interaction.behavior_interact_type);
		const characterName = character ? character.name : '모든 캐릭터';

		return `${characterName} ${behaviorLabel}`;
	}
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="건물 상호작용 검색..." />
	{#if interactionsGroupedByBuilding().length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			{#each interactionsGroupedByBuilding() as { building, interactions } (building.id)}
				<CommandGroup heading={building.name}>
					{#each interactions as interaction (interaction.id)}
						{@const label = getInteractionLabel(interaction)}
						<CommandLinkItem
							href={`/admin/scenarios/${scenarioId}/building-interactions/${interaction.id}`}
							class="group pr-1"
						>
							<IconCheck
								class={cn(
									'mr-2 size-4',
									interaction.id === currentInteractionId ? 'opacity-100' : 'opacity-0'
								)}
							/>
							<span class="flex-1 truncate">{label}</span>
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
										onclick={() =>
											openBuildingInteractionDialog({
												type: 'update',
												interactionId: interaction.id,
											})}
									>
										수정
									</DropdownMenuItem>
									<DropdownMenuItem
										onclick={() =>
											openBuildingInteractionDialog({
												type: 'delete',
												interactionId: interaction.id,
											})}
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
