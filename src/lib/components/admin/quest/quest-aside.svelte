<script lang="ts">
	import {
		Command,
		CommandInput,
		CommandList,
		CommandEmpty,
		CommandGroup,
		CommandLinkItem,
	} from '$lib/components/ui/command';
	import { IconCheck } from '@tabler/icons-svelte';
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';

	const { store } = useQuest();
	const currentQuestId = $derived(page.params.questId);
</script>

<aside class="absolute left-4 top-4 z-10 w-60">
	<Command class="rounded-lg border shadow-md">
		<CommandInput placeholder="퀘스트 검색..." />
		<CommandList>
			<CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
			<CommandGroup>
				{#each $store.data ?? [] as quest (quest.id)}
					<CommandLinkItem href={`/admin/quests/${quest.id}`}>
						<IconCheck
							class={cn(
								'mr-2 size-4',
								quest.id === currentQuestId ? 'opacity-100' : 'opacity-0'
							)}
						/>
						<div class="flex flex-col">
							<span>{quest.title || '(제목 없음)'}</span>
							<span class="text-xs text-muted-foreground">
								{quest.type === 'primary' ? '메인 퀘스트' : '서브 퀘스트'} • {quest.status === 'published' ? '게시됨' : '초안'}
							</span>
						</div>
					</CommandLinkItem>
				{/each}
			</CommandGroup>
		</CommandList>
	</Command>
</aside>
