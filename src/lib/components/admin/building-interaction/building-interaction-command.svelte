<script lang="ts">
	import { useBuilding, useCharacter, useInteraction } from '$lib/hooks';
	import { Button } from '$lib/components/ui/button';
	import {
		Command,
		CommandInput,
		CommandList,
		CommandEmpty,
		CommandGroup,
		CommandLinkItem,
		CommandShortcut,
	} from '$lib/components/ui/command';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from '$lib/components/ui/dropdown-menu';
	import { IconCheck, IconDotsVertical } from '@tabler/icons-svelte';
	import { cn } from '$lib/utils';
	import { page } from '$app/state';
	import { alphabetical, group } from 'radash';
	import type { ScenarioId, CharacterId } from '$lib/types';
	import { getFallbackString, getBehaviorInteractTypeString } from '$lib/utils/label';

	const { buildingStore } = useBuilding();
	const { characterStore } = useCharacter();
	const { buildingInteractionStore, openBuildingInteractionDialog } = useInteraction();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentInteractionId = $derived(page.params.buildingInteractionId);

	const defaultInteractions = $derived(() => {
		return Object.values($buildingInteractionStore.data).filter((i) => !i.building_id);
	});

	const interactionsGroupedByBuilding = $derived(() => {
		const interactions = Object.values($buildingInteractionStore.data).filter((i) => i.building_id);
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
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="건물 상호작용 검색..." />
	{#if defaultInteractions().length > 0 || interactionsGroupedByBuilding().length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />

			<!-- 기본 인터렉션 (모든 건물 공통) -->
			{#if defaultInteractions().length > 0}
				<CommandGroup heading="기본 (모든 건물)">
					{#each defaultInteractions() as interaction (interaction.id)}
						{@const character = interaction.character_id
							? $characterStore.data[interaction.character_id as CharacterId]
							: undefined}
						{@const interactionType = (interaction.once_interaction_type ||
							interaction.fulfill_interaction_type ||
							interaction.system_interaction_type)!}
						{@const characterName = character ? character.name : getFallbackString('allCharacters')}
						{@const label = `${characterName} ${getBehaviorInteractTypeString(interactionType)}`}
						{@const shortId = interaction.id.split('-')[0]}
						{@const isSelected = interaction.id === currentInteractionId}
						{@const href = `/admin/scenarios/${scenarioId}/building-interactions/${interaction.id}`}
						<CommandLinkItem {href} class="group pr-1">
							<IconCheck class={cn('mr-2 size-4', isSelected ? 'opacity-100' : 'opacity-0')} />
							<span class="flex-1 truncate">{label}</span>
							<CommandShortcut>{shortId}</CommandShortcut>
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
												buildingInteractionId: interaction.id,
											})}
									>
										수정
									</DropdownMenuItem>
									<DropdownMenuItem
										onclick={() =>
											openBuildingInteractionDialog({
												type: 'delete',
												buildingInteractionId: interaction.id,
											})}
									>
										삭제
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</CommandLinkItem>
					{/each}
				</CommandGroup>
			{/if}

			<!-- 특정 건물 인터렉션 -->
			{#each interactionsGroupedByBuilding() as { building, interactions } (building.id)}
				<CommandGroup heading={building.name}>
					{#each interactions as interaction (interaction.id)}
						{@const character = interaction.character_id
							? $characterStore.data[interaction.character_id as CharacterId]
							: undefined}
						{@const interactionType = (interaction.once_interaction_type ||
							interaction.fulfill_interaction_type ||
							interaction.system_interaction_type)!}
						{@const characterName = character ? character.name : getFallbackString('allCharacters')}
						{@const label = `${characterName} ${getBehaviorInteractTypeString(interactionType)}`}
						{@const shortId = interaction.id.split('-')[0]}
						{@const isSelected = interaction.id === currentInteractionId}
						{@const href = `/admin/scenarios/${scenarioId}/building-interactions/${interaction.id}`}
						<CommandLinkItem {href} class="group pr-1">
							<IconCheck class={cn('mr-2 size-4', isSelected ? 'opacity-100' : 'opacity-0')} />
							<span class="flex-1 truncate">{label}</span>
							<CommandShortcut>{shortId}</CommandShortcut>
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
												buildingInteractionId: interaction.id,
											})}
									>
										수정
									</DropdownMenuItem>
									<DropdownMenuItem
										onclick={() =>
											openBuildingInteractionDialog({
												type: 'delete',
												buildingInteractionId: interaction.id,
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
