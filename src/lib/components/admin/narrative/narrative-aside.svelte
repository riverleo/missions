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
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconCheck, IconDotsVertical, IconInputSearch } from '@tabler/icons-svelte';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import NarrativeCreateButton from './narrative-create-button.svelte';
	import NarrativeUpdateButton from './narrative-update-button.svelte';
	import NarrativeDeleteButton from './narrative-delete-button.svelte';

	const { store } = useNarrative();
	const currentNarrativeId = $derived(page.params.narrativeId);

	let toggleValue = $state<string[]>(['list']);

	let editingNarrativeId = $state<string | undefined>();
	let editDialogOpen = $state(false);
	let deletingNarrativeId = $state<string | undefined>();
	let deleteDialogOpen = $state(false);

	function openEditDialog(narrativeId: string) {
		editingNarrativeId = narrativeId;
		editDialogOpen = true;
	}

	function openDeleteDialog(narrativeId: string) {
		deletingNarrativeId = narrativeId;
		deleteDialogOpen = true;
	}
</script>

<aside class="absolute top-4 left-4 z-10 flex flex-col gap-2">
	<ButtonGroup>
		<ToggleGroup type="multiple" variant="outline" bind:value={toggleValue}>
			<Tooltip>
				<TooltipTrigger>
					{#snippet child({ props })}
						<ToggleGroupItem {...props} value="list" size="icon">
							<IconInputSearch class="size-4" />
						</ToggleGroupItem>
					{/snippet}
				</TooltipTrigger>
				<TooltipContent>검색창 {toggleValue.includes('list') ? '숨기기' : '보기'}</TooltipContent>
			</Tooltip>
		</ToggleGroup>
		<ButtonGroup>
			<NarrativeCreateButton />
			<NarrativeUpdateButton
				variant="outline"
				size="icon"
				disabled={!currentNarrativeId}
				narrativeId={currentNarrativeId}
			/>
		</ButtonGroup>
		<ButtonGroup>
			<NarrativeDeleteButton
				variant="outline"
				size="icon"
				disabled={!currentNarrativeId}
				narrativeId={currentNarrativeId}
			/>
		</ButtonGroup>
	</ButtonGroup>

	{#if toggleValue.includes('list')}
		<Command class="w-80 rounded-lg border shadow-md">
			<CommandInput placeholder="대화 또는 효과 검색..." />
			<CommandList>
				<CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
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
									<DropdownMenuItem onclick={() => openEditDialog(narrative.id)}>
										수정
									</DropdownMenuItem>
									<DropdownMenuItem onclick={() => openDeleteDialog(narrative.id)}>
										삭제
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</CommandLinkItem>
					{/each}
				</CommandGroup>
			</CommandList>
		</Command>
	{/if}
</aside>

<!-- 드롭다운에서 트리거되는 수정/삭제 다이얼로그 -->
<NarrativeUpdateButton
	bind:open={editDialogOpen}
	showTrigger={false}
	narrativeId={editingNarrativeId}
/>
<NarrativeDeleteButton
	bind:open={deleteDialogOpen}
	showTrigger={false}
	narrativeId={deletingNarrativeId}
/>
