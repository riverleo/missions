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
	import { useItem } from '$lib/hooks/use-item';
	import { useCharacter } from '$lib/hooks/use-character';
	import { getBehaviorInteractTypeLabel } from '$lib/utils/state-label';
	import { page } from '$app/state';
	import { alphabetical, group } from 'radash';
	import type { ScenarioId, ItemId, CharacterId, ItemInteraction } from '$lib/types';

	const { itemStore, itemInteractionStore, openItemInteractionDialog } = useItem();
	const { characterStore } = useCharacter();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentInteractionId = $derived(page.params.itemInteractionId);

	const defaultInteractions = $derived(() => {
		return Object.values($itemInteractionStore.data).filter((i) => !i.item_id);
	});

	const interactionsGroupedByItem = $derived(() => {
		const interactions = Object.values($itemInteractionStore.data).filter((i) => i.item_id);
		const grouped = group(interactions, (i) => i.item_id);
		const items = Object.values($itemStore.data);
		const sortedItems = alphabetical(items, (b) => b.name);

		return sortedItems
			.map((item) => ({
				item,
				interactions: grouped[item.id] ?? [],
			}))
			.filter((g) => g.interactions.length > 0);
	});
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="아이템 상호작용 검색..." />
	{#if defaultInteractions().length > 0 || interactionsGroupedByItem().length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />

			<!-- 기본 인터렉션 (모든 아이템 공통) -->
			{#if defaultInteractions().length > 0}
				<CommandGroup heading="기본 (모든 아이템)">
					{#each defaultInteractions() as interaction (interaction.id)}
						{@const character = interaction.character_id
							? $characterStore.data[interaction.character_id as CharacterId]
							: undefined}
						{@const interactionType = (interaction.once_interaction_type ||
							interaction.repeat_interaction_type)!}
						{@const characterName = character ? character.name : '모든 캐릭터'}
						{@const label = `${characterName} ${getBehaviorInteractTypeLabel(interactionType)}`}
						{@const shortId = interaction.id.split('-')[0]}
						{@const isSelected = interaction.id === currentInteractionId}
						{@const href = `/admin/scenarios/${scenarioId}/item-interactions/${interaction.id}`}
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
											openItemInteractionDialog({
												type: 'update',
												itemInteractionId: interaction.id,
											})}
									>
										수정
									</DropdownMenuItem>
									<DropdownMenuItem
										onclick={() =>
											openItemInteractionDialog({
												type: 'delete',
												itemInteractionId: interaction.id,
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

			<!-- 특정 아이템 인터렉션 -->
			{#each interactionsGroupedByItem() as { item, interactions } (item.id)}
				<CommandGroup heading={item.name}>
					{#each interactions as interaction (interaction.id)}
						{@const character = interaction.character_id
							? $characterStore.data[interaction.character_id as CharacterId]
							: undefined}
						{@const interactionType = (interaction.once_interaction_type ||
							interaction.repeat_interaction_type)!}
						{@const characterName = character ? character.name : '모든 캐릭터'}
						{@const label = `${characterName} ${getBehaviorInteractTypeLabel(interactionType)}`}
						{@const shortId = interaction.id.split('-')[0]}
						{@const isSelected = interaction.id === currentInteractionId}
						{@const href = `/admin/scenarios/${scenarioId}/item-interactions/${interaction.id}`}
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
											openItemInteractionDialog({
												type: 'update',
												itemInteractionId: interaction.id,
											})}
									>
										수정
									</DropdownMenuItem>
									<DropdownMenuItem
										onclick={() =>
											openItemInteractionDialog({
												type: 'delete',
												itemInteractionId: interaction.id,
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
