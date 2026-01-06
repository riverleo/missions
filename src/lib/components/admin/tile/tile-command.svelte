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
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { page } from '$app/state';
	import { alphabetical } from 'radash';
	import type { ScenarioId } from '$lib/types';

	const { tileStore, openTileDialog } = useTerrain();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentTileId = $derived(page.params.tileId);

	const tiles = $derived(alphabetical(Object.values($tileStore.data), (t) => t.name));
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="타일 검색..." />
	{#if tiles.length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			<CommandGroup>
				{#each tiles as tile (tile.id)}
					<CommandLinkItem
						href={`/admin/scenarios/${scenarioId}/tiles/${tile.id}`}
						class="group pr-1"
					>
						<IconCheck
							class={cn('mr-2 size-4', tile.id === currentTileId ? 'opacity-100' : 'opacity-0')}
						/>
						<span class="flex-1 truncate">
							{tile.name || `이름없음 (${tile.id.split('-')[0]})`}
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
									onclick={() => openTileDialog({ type: 'update', tileId: tile.id })}
								>
									수정
								</DropdownMenuItem>
								<DropdownMenuItem
									onclick={() => openTileDialog({ type: 'delete', tileId: tile.id })}
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
