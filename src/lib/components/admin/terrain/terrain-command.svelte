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
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { sort } from 'radash';

	const { store, openDialog } = useTerrain();
	const scenarioId = $derived(page.params.scenarioId);
	const currentTerrainId = $derived(page.params.terrainId);

	const terrains = $derived(sort(Object.values($store.data), (t) => t.display_order));
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="지형 검색..." />
	{#if terrains.length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			<CommandGroup>
				{#each terrains as terrain (terrain.id)}
					<CommandLinkItem
						href={`/admin/scenarios/${scenarioId}/terrains/${terrain.id}`}
						class="group pr-1"
					>
						<IconCheck
							class={cn(
								'mr-2 size-4',
								terrain.id === currentTerrainId ? 'opacity-100' : 'opacity-0'
							)}
						/>
						<span class="flex-1 truncate">
							{terrain.title || `제목없음 (${terrain.id.split('-')[0]})`}
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
									onclick={() => openDialog({ type: 'delete', terrainId: terrain.id })}
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
