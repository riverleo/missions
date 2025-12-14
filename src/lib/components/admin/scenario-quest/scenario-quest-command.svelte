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
	import { useScenario } from '$lib/hooks/use-scenario';
	import { useScenarioQuest } from '$lib/hooks/use-scenario-quest';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { group, sort } from 'radash';

	const NO_SCENARIO_CHAPTER = 'no-scenario-chapter';

	const { store: scenarioStore } = useScenario();
	const { store, openDialog } = useScenarioQuest();
	const currentScenarioId = $derived($scenarioStore.currentScenarioId);
	const currentScenarioQuestId = $derived(page.params.scenarioQuestId);

	// 퀘스트를 챕터별로 그룹화
	const scenarioQuestsByScenarioChapter = $derived(() => {
		const scenarioQuests = $store.data ?? [];
		const grouped = group(scenarioQuests, (q) => q.scenario_chapter?.id ?? NO_SCENARIO_CHAPTER);

		// 챕터 순서대로 정렬
		const sortedEntries = sort(Object.entries(grouped), ([_, scenarioQuests]) => {
			if (!scenarioQuests?.[0]?.scenario_chapter) return Infinity;
			return scenarioQuests[0].scenario_chapter.display_order_in_scenario ?? 0;
		});

		return sortedEntries.map(([scenarioChapterId, scenarioQuests]) => {
			const chapter = scenarioQuests?.[0]?.scenario_chapter;
			let scenarioChapterTitle = '챕터 없음';
			if (chapter) {
				scenarioChapterTitle = chapter.title || `제목없음 (${chapter.id.split('-')[0]})`;
			}
			return {
				scenarioChapterId,
				scenarioChapterTitle,
				scenarioQuests: sort(scenarioQuests ?? [], (q) => q.order_in_chapter),
			};
		});
	});
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="퀘스트 검색..." />
	{#if ($store.data ?? []).length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			{#each scenarioQuestsByScenarioChapter() as { scenarioChapterId, scenarioChapterTitle, scenarioQuests } (scenarioChapterId)}
				<CommandGroup heading={scenarioChapterTitle}>
					{#each scenarioQuests as scenarioQuest (scenarioQuest.id)}
						<CommandLinkItem
							href={`/admin/scenarios/${currentScenarioId}/quests/${scenarioQuest.id}`}
							class="group pr-1"
						>
							<IconCheck
								class={cn(
									'mr-2 size-4',
									scenarioQuest.id === currentScenarioQuestId ? 'opacity-100' : 'opacity-0'
								)}
							/>
							<div class="flex flex-1 flex-col">
								<span class="truncate">{scenarioQuest.title || `제목없음 (${scenarioQuest.id.split('-')[0]})`}</span>
								<span class="text-xs text-muted-foreground">
									{scenarioQuest.type === 'primary' ? '메인 퀘스트' : '보조 퀘스트'} • {scenarioQuest.status ===
									'published'
										? '공개됨'
										: '작업중'}
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
										onclick={() =>
											openDialog({ type: 'update', scenarioQuestId: scenarioQuest.id })}
									>
										수정
									</DropdownMenuItem>
									<DropdownMenuItem
										onclick={() =>
											openDialog({ type: 'publish', scenarioQuestId: scenarioQuest.id })}
									>
										{scenarioQuest.status === 'published' ? '작업중으로 전환' : '공개로 전환'}
									</DropdownMenuItem>
									<DropdownMenuItem
										onclick={() =>
											openDialog({ type: 'delete', scenarioQuestId: scenarioQuest.id })}
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
