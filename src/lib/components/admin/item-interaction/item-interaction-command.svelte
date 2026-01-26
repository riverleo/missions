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
	import { useItem } from '$lib/hooks/use-item';
	import { useCharacter } from '$lib/hooks/use-character';
	import { page } from '$app/state';
	import { alphabetical, group } from 'radash';
	import type {
		ScenarioId,
		ItemId,
		CharacterId,
		ItemInteraction,
	} from '$lib/types';

	const { itemStore, itemInteractionStore, openItemInteractionDialog } = useItem();
	const { characterStore } = useCharacter();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentInteractionId = $derived(page.params.itemInteractionId);

	const interactionsGroupedByItem = $derived(() => {
		const interactions = Object.values($itemInteractionStore.data);
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

	function getInteractionLabel(interaction: ItemInteraction) {
		const character = interaction.character_id
			? $characterStore.data[interaction.character_id as CharacterId]
			: undefined;

		const behaviorLabel = getBehaviorLabel(interaction.behavior_interact_type);
		const characterName = character ? character.name : '모든 캐릭터';

		return `${characterName} ${behaviorLabel}`;
	}
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="아이템 상호작용 검색..." />
	{#if interactionsGroupedByItem().length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			{#each interactionsGroupedByItem() as { item, interactions } (item.id)}
				<CommandGroup heading={item.name}>
					{#each interactions as interaction (interaction.id)}
						{@const label = getInteractionLabel(interaction)}
						<CommandLinkItem
							href={`/admin/scenarios/${scenarioId}/item-interactions/${interaction.id}`}
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
											openItemInteractionDialog({ type: 'update', interactionId: interaction.id })}
									>
										수정
									</DropdownMenuItem>
									<DropdownMenuItem
										onclick={() =>
											openItemInteractionDialog({ type: 'delete', interactionId: interaction.id })}
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
