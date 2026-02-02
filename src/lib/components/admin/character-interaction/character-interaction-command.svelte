<script lang="ts">
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
	import { useCharacter } from '$lib/hooks/use-character';
	import { getBehaviorInteractTypeLabel } from '$lib/utils/state-label';
	import { page } from '$app/state';
	import { alphabetical, group } from 'radash';
	import type { ScenarioId, CharacterId, CharacterInteraction } from '$lib/types';

	const { characterStore, characterInteractionStore, openCharacterInteractionDialog } =
		useCharacter();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentInteractionId = $derived(page.params.characterInteractionId);

	const defaultInteractions = $derived(() => {
		return Object.values($characterInteractionStore.data).filter((i) => !i.target_character_id);
	});

	const interactionsGroupedByTargetCharacter = $derived(() => {
		const interactions = Object.values($characterInteractionStore.data).filter(
			(i) => i.target_character_id
		);
		const grouped = group(interactions, (i) => i.target_character_id);
		const characters = Object.values($characterStore.data);
		const sortedCharacters = alphabetical(characters, (c) => c.name);

		return sortedCharacters
			.map((character) => ({
				targetCharacter: character,
				interactions: grouped[character.id] ?? [],
			}))
			.filter((g) => g.interactions.length > 0);
	});

	function getInteractionLabel(interaction: CharacterInteraction) {
		const character = interaction.character_id
			? $characterStore.data[interaction.character_id as CharacterId]
			: undefined;

		const interactionType = (interaction.once_interaction_type ||
			interaction.repeat_interaction_type)!;
		const behaviorLabel = getBehaviorInteractTypeLabel(interactionType);
		const characterName = character ? character.name : '모든 캐릭터';

		return `${characterName} ${behaviorLabel}`;
	}
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="캐릭터 상호작용 검색..." />
	{#if defaultInteractions().length > 0 || interactionsGroupedByTargetCharacter().length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			{#if defaultInteractions().length > 0}
				<CommandGroup heading="기본 (모든 캐릭터)">
					{#each defaultInteractions() as interaction (interaction.id)}
						{@const label = getInteractionLabel(interaction)}
						{@const shortId = interaction.id.split('-')[0]}
						<CommandLinkItem
							href={`/admin/scenarios/${scenarioId}/character-interactions/${interaction.id}`}
							class="group pr-1"
						>
							<IconCheck
								class={cn(
									'mr-2 size-4',
									interaction.id === currentInteractionId ? 'opacity-100' : 'opacity-0'
								)}
							/>
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
											openCharacterInteractionDialog({
												type: 'update',
												characterInteractionId: interaction.id,
											})}
									>
										수정
									</DropdownMenuItem>
									<DropdownMenuItem
										onclick={() =>
											openCharacterInteractionDialog({
												type: 'delete',
												characterInteractionId: interaction.id,
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
			{#each interactionsGroupedByTargetCharacter() as { targetCharacter, interactions } (targetCharacter.id)}
				<CommandGroup heading={targetCharacter.name}>
					{#each interactions as interaction (interaction.id)}
						{@const label = getInteractionLabel(interaction)}
						{@const shortId = interaction.id.split('-')[0]}
						<CommandLinkItem
							href={`/admin/scenarios/${scenarioId}/character-interactions/${interaction.id}`}
							class="group pr-1"
						>
							<IconCheck
								class={cn(
									'mr-2 size-4',
									interaction.id === currentInteractionId ? 'opacity-100' : 'opacity-0'
								)}
							/>
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
											openCharacterInteractionDialog({
												type: 'update',
												characterInteractionId: interaction.id,
											})}
									>
										수정
									</DropdownMenuItem>
									<DropdownMenuItem
										onclick={() =>
											openCharacterInteractionDialog({
												type: 'delete',
												characterInteractionId: interaction.id,
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
