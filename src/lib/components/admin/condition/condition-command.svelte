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
	import { useCondition } from '$lib/hooks/use-condition';
	import { page } from '$app/state';
	import { alphabetical } from 'radash';
	import type { ScenarioId } from '$lib/types';

	const { conditionStore, openDialog } = useCondition();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentConditionId = $derived(page.params.conditionId);

	const conditions = $derived(alphabetical(Object.values($conditionStore.data), (c) => c.name));
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="컨디션 검색..." />
	{#if conditions.length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			<CommandGroup>
				{#each conditions as condition (condition.id)}
					<CommandLinkItem
						href={`/admin/scenarios/${scenarioId}/conditions/${condition.id}`}
						class="group pr-1"
					>
						<IconCheck
							class={cn(
								'mr-2 size-4',
								condition.id === currentConditionId ? 'opacity-100' : 'opacity-0'
							)}
						/>
						<span class="flex-1 truncate">
							{condition.name || `이름없음 (${condition.id.split('-')[0]})`}
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
									onclick={() => openDialog({ type: 'delete', conditionId: condition.id })}
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
