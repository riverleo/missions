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
	import { useCharacter } from '$lib/hooks/use-character';
	import { page } from '$app/state';
	import { alphabetical } from 'radash';

	const { store, openDialog } = useCharacter();
	const scenarioId = $derived(page.params.scenarioId);
	const currentCharacterId = $derived(page.params.characterId);

	const characters = $derived(alphabetical(Object.values($store.data), (c) => c.name));
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="캐릭터 검색..." />
	{#if characters.length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			<CommandGroup>
				{#each characters as character (character.id)}
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
							{character.name || `이름없음 (${character.id.split('-')[0]})`}
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
									onclick={() => openDialog({ type: 'update', characterId: character.id })}
								>
									수정
								</DropdownMenuItem>
								<DropdownMenuItem
									onclick={() => openDialog({ type: 'delete', characterId: character.id })}
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
