<script lang="ts">
	import { useItem } from '$lib/hooks';
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
	import type { ScenarioId } from '$lib/types';

	const { itemStore, openItemDialog } = useItem();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentItemId = $derived(page.params.itemId);

	const items = $derived(alphabetical(Object.values($itemStore.data), (i) => i.name));
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="아이템 검색..." />
	{#if items.length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			<CommandGroup>
				{#each items as item (item.id)}
					{@const shortId = item.id.split('-')[0]}
					<CommandLinkItem
						href={`/admin/scenarios/${scenarioId}/items/${item.id}`}
						class="group pr-1"
					>
						<IconCheck
							class={cn('mr-2 size-4', item.id === currentItemId ? 'opacity-100' : 'opacity-0')}
						/>
						<span class="flex-1 truncate">
							{item.name || `이름없음 (${shortId})`}
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
									onclick={() => openItemDialog({ type: 'update', itemId: item.id })}
								>
									수정
								</DropdownMenuItem>
								<DropdownMenuItem
									onclick={() => openItemDialog({ type: 'delete', itemId: item.id })}
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
