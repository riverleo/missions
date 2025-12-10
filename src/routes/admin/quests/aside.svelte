<script lang="ts">
	import {
		ItemGroup,
		Item,
		ItemContent,
		ItemTitle,
		ItemDescription,
	} from '$lib/components/ui/item';
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import QuestCreateButton from './quest-create-button.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';

	const { quests } = useQuest();
</script>

<aside class="w-80 overflow-y-auto border-r">
	<header class="mb-4 flex h-16 items-center justify-between border-b p-4">
		<h2 class="text-lg font-semibold">퀘스트</h2>
		<QuestCreateButton />
	</header>

	{#if $quests.status === 'loading'}
		<div class="space-y-2 p-4">
			<Skeleton class="h-16 w-full" />
			<Skeleton class="h-16 w-full" />
			<Skeleton class="h-16 w-full" />
		</div>
	{:else if $quests.status === 'error'}
		<div class="p-4 text-sm text-destructive">퀘스트를 불러오는데 실패했습니다.</div>
	{:else if $quests.data && $quests.data.length > 0}
		<ItemGroup>
			{#each $quests.data as quest (quest.id)}
				<Item>
					{#snippet child({ props })}
						<a href={`/admin/quests/${quest.id}`} {...props}>
							<ItemContent>
								<ItemTitle>{quest.title}</ItemTitle>
								<ItemDescription>
									{quest.type === 'primary' ? '메인 퀘스트' : '서브 퀘스트'} • {quest.status ===
									'published'
										? '게시됨'
										: '초안'}
								</ItemDescription>
							</ItemContent>
						</a>
					{/snippet}
				</Item>
			{/each}
		</ItemGroup>
	{:else}
		<div class="p-4 text-sm text-muted-foreground">퀘스트가 없습니다.</div>
	{/if}
</aside>
