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
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';

	const { store, openDialog } = useNarrative();
	const currentNarrativeId = $derived(page.params.narrativeId);
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="대화 또는 효과 검색..." />
	{#if ($store.data ?? []).length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			<CommandGroup>
				{#each $store.data ?? [] as narrative (narrative.id)}
					<CommandLinkItem href={`/admin/narratives/${narrative.id}`} class="group pr-1">
						<IconCheck
							class={cn(
								'mr-2 size-4',
								narrative.id === currentNarrativeId ? 'opacity-100' : 'opacity-0'
							)}
						/>
						<span class="flex-1 truncate">{narrative.title || '(제목 없음)'}</span>
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
									onclick={() => openDialog({ type: 'update', narrativeId: narrative.id })}
								>
									수정
								</DropdownMenuItem>
								<DropdownMenuItem
									onclick={() => openDialog({ type: 'delete', narrativeId: narrative.id })}
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
