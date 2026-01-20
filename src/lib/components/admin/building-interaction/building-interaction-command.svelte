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
	import type {
		ScenarioId,
		BuildingId,
		CharacterId,
		BuildingInteraction,
	} from '$lib/types';

	const { store, buildingInteractionStore, openInteractionDialog } = useBuilding();
	const { store: characterStore } = useCharacter();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentInteractionId = $derived(page.params.buildingInteractionId);

	const interactionsGroupedByBuilding = $derived(() => {
		const interactions = Object.values($buildingInteractionStore.data);
		const grouped = group(interactions, (i) => i.building_id);
		const buildings = Object.values($store.data);
		const sortedBuildings = alphabetical(buildings, (b) => b.name);

		return sortedBuildings
			.map((building) => ({
				building,
				interactions: grouped[building.id] ?? [],
			}))
			.filter((g) => g.interactions.length > 0);
	});

	function getBehaviorLabel(type: string) {
		const labels: Record<string, string> = {
			demolish: '철거',
			use: '사용',
			repair: '수리',
			clean: '청소',
			pick: '줍기',
		};
		return labels[type] ?? type;
	}

	function getInteractionLabel(interaction: BuildingInteraction) {
		const character = interaction.character_id
			? $characterStore.data[interaction.character_id as CharacterId]
			: undefined;

		const behaviorLabel = getBehaviorLabel(interaction.character_behavior_type);
		const characterLabel = character ? ` (${character.name})` : '';

		return {
			title: `${behaviorLabel}${characterLabel}`,
			description: character ? `특정 캐릭터용` : `모든 캐릭터용`,
		};
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
							<div class="flex flex-1 flex-col truncate">
								<span class="truncate">{label.title}</span>
								<span class="truncate text-xs text-muted-foreground">{label.description}</span>
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
										onclick={() =>
											openInteractionDialog({ type: 'delete', interactionId: interaction.id })}
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
