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
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { group, sort } from 'radash';

	const { store, openDialog } = useQuest();
	const currentQuestId = $derived(page.params.questId);

	// 퀘스트를 챕터별로 그룹화
	const questsByChapter = $derived(() => {
		const quests = $store.data ?? [];
		const grouped = group(quests, (q) => q.chapter?.id);

		// 챕터 순서대로 정렬
		const sortedEntries = sort(Object.entries(grouped), ([_, quests]) => {
			if (!quests?.[0]?.chapter) return Infinity;
			return quests[0].chapter.order ?? 0;
		});

		return sortedEntries.map(([chapterId, quests]) => ({
			chapterId,
			chapterTitle: quests?.[0]?.chapter?.title ?? '챕터 없음',
			quests: sort(quests ?? [], (q) => q.order_in_chapter),
		}));
	});
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="퀘스트 검색..." />
	{#if ($store.data ?? []).length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
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
										? '공개됨'
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
									<DropdownMenuItem
										onclick={() => openDialog({ type: 'update', questId: quest.id })}
									>
										수정
									</DropdownMenuItem>
									<DropdownMenuItem
										onclick={() => openDialog({ type: 'publish', questId: quest.id })}
									>
										{quest.status === 'published' ? '초안으로 전환' : '공개'}
									</DropdownMenuItem>
									<DropdownMenuItem
										onclick={() => openDialog({ type: 'delete', questId: quest.id })}
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
