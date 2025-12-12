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
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { group, sort } from 'radash';
	import QuestCreateButton from './quest-create-button.svelte';
	import QuestUpdateButton from './quest-update-button.svelte';
	import QuestDeleteButton from './quest-delete-button.svelte';

	const { store } = useQuest();
	const currentQuestId = $derived(page.params.questId);

	let toggleValue = $state<string[]>(['list']);

	let editingQuestId = $state<string | undefined>();
	let editDialogOpen = $state(false);
	let deletingQuestId = $state<string | undefined>();
	let deleteDialogOpen = $state(false);

	function openEditDialog(questId: string) {
		editingQuestId = questId;
		editDialogOpen = true;
	}

	function openDeleteDialog(questId: string) {
		deletingQuestId = questId;
		deleteDialogOpen = true;
	}

	// 퀘스트를 챕터별로 그룹화
	const questsByChapter = $derived(() => {
		const quests = $store.data ?? [];
		const grouped = group(quests, (q) => q.chapter?.id ?? 'no-chapter');

		// 챕터 순서대로 정렬
		const sortedEntries = sort(Object.entries(grouped), ([chapterId, quests]) => {
			if (chapterId === 'no-chapter') return Infinity;
			return quests?.[0]?.chapter?.order ?? 0;
		});

		return sortedEntries.map(([chapterId, quests]) => ({
			chapterId,
			chapterTitle:
				chapterId === 'no-chapter' ? '챕터 미지정' : (quests?.[0]?.chapter?.title ?? '알 수 없음'),
			quests: sort(quests ?? [], (q) => q.order_in_chapter),
		}));
	});
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
				<TooltipContent>목록 {toggleValue.includes('list') ? '숨기기' : '보기'}</TooltipContent>
			</Tooltip>
		</ToggleGroup>
		<ButtonGroup>
			<QuestCreateButton />
			<QuestUpdateButton
				questId={currentQuestId}
				variant="outline"
				size="icon"
				disabled={!currentQuestId}
			/>
		</ButtonGroup>
		<ButtonGroup>
			<QuestDeleteButton
				questId={currentQuestId}
				variant="outline"
				size="icon"
				disabled={!currentQuestId}
			/>
		</ButtonGroup>
	</ButtonGroup>

	{#if toggleValue.includes('list')}
		<Command class="w-80 rounded-lg border shadow-md">
			<CommandInput placeholder="퀘스트 검색..." />
			<CommandList>
				<CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
				{#each questsByChapter() as { chapterId, chapterTitle, quests } (chapterId)}
					<CommandGroup heading={chapterTitle}>
						{#each quests as quest (quest.id)}
							<CommandLinkItem href={`/admin/quests/${quest.id}`} class="group pr-1">
								<IconCheck
									class={cn(
										'mr-2 size-4',
										quest.id === currentQuestId ? 'opacity-100' : 'opacity-0'
									)}
								/>
								<div class="flex flex-1 flex-col">
									<span class="truncate">{quest.title || '(제목 없음)'}</span>
									<span class="text-xs text-muted-foreground">
										{quest.type === 'primary' ? '메인 퀘스트' : '서브 퀘스트'} • {quest.status ===
										'published'
											? '게시됨'
											: '초안'}
									</span>
								</div>
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
										<DropdownMenuItem onclick={() => openEditDialog(quest.id)}>
											수정
										</DropdownMenuItem>
										<DropdownMenuItem onclick={() => openDeleteDialog(quest.id)}>
											삭제
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</CommandLinkItem>
						{/each}
					</CommandGroup>
				{/each}
			</CommandList>
		</Command>
	{/if}
</aside>

<!-- 드롭다운에서 트리거되는 수정/삭제 다이얼로그 -->
<QuestUpdateButton bind:open={editDialogOpen} showTrigger={false} questId={editingQuestId} />
<QuestDeleteButton bind:open={deleteDialogOpen} showTrigger={false} questId={deletingQuestId} />
