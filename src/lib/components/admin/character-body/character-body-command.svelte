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
	import { page } from '$app/state';
	import { alphabetical } from 'radash';
	import type { ScenarioId } from '$lib/types';

	const { characterBodyStore, openCharacterBodyDialog } = useCharacter();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentBodyId = $derived(page.params.bodyId);

	const bodies = $derived(alphabetical(Object.values($characterBodyStore.data), (b) => b.name));
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="바디 검색..." />
	{#if bodies.length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			<CommandGroup>
				{#each bodies as body (body.id)}
					{@const shortId = body.id.split('-')[0]}
					<CommandLinkItem
						href={`/admin/scenarios/${scenarioId}/character-bodies/${body.id}`}
						class="group pr-1"
					>
						<IconCheck
							class={cn('mr-2 size-4', body.id === currentBodyId ? 'opacity-100' : 'opacity-0')}
						/>
						<span class="flex-1 truncate">
							{body.name || `이름없음 (${shortId})`}
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
								<DropdownMenuItem onclick={() => openCharacterBodyDialog({ type: 'delete', bodyId: body.id })}>
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
