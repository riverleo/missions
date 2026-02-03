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
	import type { ScenarioId } from '$lib/types';

	const { needStore, openNeedDialog } = useCharacter();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentNeedId = $derived(page.params.needId);

	const needs = $derived(alphabetical(Object.values($needStore.data), (n) => n.name));
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="욕구 검색..." />
	{#if needs.length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			<CommandGroup>
				{#each needs as need (need.id)}
					{@const shortId = need.id.split('-')[0]}
					<CommandLinkItem
						href={`/admin/scenarios/${scenarioId}/needs/${need.id}`}
						class="group pr-1"
					>
						<IconCheck
							class={cn('mr-2 size-4', need.id === currentNeedId ? 'opacity-100' : 'opacity-0')}
						/>
						<span class="flex-1 truncate">
							{need.name || `이름없음 (${shortId})`}
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
									onclick={() => openNeedDialog({ type: 'delete', needId: need.id })}
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
