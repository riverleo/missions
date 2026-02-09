<script lang="ts">
	import { useCharacter } from '$lib/hooks';
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
	import { alphabetical } from 'radash';
	import type { CharacterId, ScenarioId } from '$lib/types';

	const { characterStore, openCharacterDialog } = useCharacter();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentCharacterId = $derived(page.params.characterId as CharacterId);

	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="캐릭터 검색..." />
	{#if characters.length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			<CommandGroup>
				{#each characters as character (character.id)}
					{@const shortId = character.id.split('-')[0]}
					<CommandLinkItem
						href={`/admin/scenarios/${scenarioId}/characters/${character.id}`}
						class="group pr-1"
					>
						<IconCheck
							class={cn(
								'mr-2 size-4',
								character.id === currentCharacterId ? 'opacity-100' : 'opacity-0'
							)}
						/>
						<span class="flex-1 truncate">
							{character.name || `이름없음 (${shortId})`}
						</span>
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
									onclick={() => openCharacterDialog({ type: 'update', characterId: character.id })}
								>
									수정
								</DropdownMenuItem>
								<DropdownMenuItem
									onclick={() => openCharacterDialog({ type: 'delete', characterId: character.id })}
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
