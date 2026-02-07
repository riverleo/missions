<script lang="ts">
	import { useChapter, useQuest } from '$lib/hooks';
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
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { getFallbackString, getDisplayTitle } from '$lib/utils/state-label';
	import { group, sort } from 'radash';
	import type { Quest, ScenarioId, ChapterId } from '$lib/types';

	const NO_CHAPTER = 'no-chapter';

	const { questStore, openQuestDialog } = useQuest();
	const { chapterStore } = useChapter();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentQuestId = $derived(page.params.questId);

	const quests = $derived(Object.values($questStore.data));
	const chapters = $derived($chapterStore.data);

	// 퀘스트를 챕터별로 그룹화
	const questsByChapter = $derived(() => {
		const grouped = group(quests, (q: Quest) => q.chapter_id ?? NO_CHAPTER);

		// 챕터 순서대로 정렬
		const sortedEntries = sort(Object.entries(grouped), ([chapterId]) => {
			if (chapterId === NO_CHAPTER) return Infinity;
			const chapter = chapters[chapterId as ChapterId];
			return chapter?.display_order_in_scenario ?? Infinity;
		});

		return sortedEntries.map(([chapterId, chapterQuests]) => {
			const chapter = chapterId !== NO_CHAPTER ? chapters[chapterId as ChapterId] : undefined;
			let chapterTitle = getFallbackString('noChapter');
			if (chapter) {
				chapterTitle = getDisplayTitle(chapter.title, chapter.id);
			}
			return {
				chapterId,
				chapterTitle,
				quests: sort(chapterQuests ?? [], (q: Quest) => q.order_in_chapter),
			};
		});
	});
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="퀘스트 검색..." />
	{#if quests.length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			{#each questsByChapter() as { chapterId, chapterTitle, quests } (chapterId)}
				<CommandGroup heading={chapterTitle}>
					{#each quests as quest (quest.id)}
						{@const shortId = quest.id.split('-')[0]}
						<CommandLinkItem
							href={`/admin/scenarios/${scenarioId}/quests/${quest.id}`}
							class="group pr-1"
						>
							<IconCheck
								class={cn('mr-2 size-4', quest.id === currentQuestId ? 'opacity-100' : 'opacity-0')}
							/>
							<div class="flex flex-1 flex-col">
								<span class="truncate">
									{quest.title || `제목없음 (${shortId})`}
								</span>
								<span class="text-xs text-muted-foreground">
									{quest.type === 'primary' ? '메인 퀘스트' : '보조 퀘스트'} • {quest.status ===
									'published'
										? '공개됨'
										: '작업중'}
								</span>
							</div>
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
										onclick={() => openQuestDialog({ type: 'update', questId: quest.id })}
									>
										수정
									</DropdownMenuItem>
									<DropdownMenuItem
										onclick={() => openQuestDialog({ type: 'publish', questId: quest.id })}
									>
										{quest.status === 'published' ? '작업중으로 전환' : '공개로 전환'}
									</DropdownMenuItem>
									<DropdownMenuItem
										onclick={() => openQuestDialog({ type: 'delete', questId: quest.id })}
									>
										삭제
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</CommandLinkItem>
					{/each}
				</CommandGroup>
			{/each}
		</CommandList>
	{/if}
</Command>
