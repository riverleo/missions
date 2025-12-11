<script lang="ts">
	import {
		ItemGroup,
		Item,
		ItemContent,
		ItemTitle,
		ItemDescription,
	} from '$lib/components/ui/item';
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';

	const { store } = useQuest();
	const currentQuestId = $derived($page.params.questId);
</script>

<aside class="w-60 overflow-y-auto border-r bg-muted/30 p-2">
	{#if $store.status === 'loading'}
		<div class="space-y-2 p-4">
			<Skeleton class="h-16 w-full" />
			<Skeleton class="h-16 w-full" />
			<Skeleton class="h-16 w-full" />
		</div>
	{:else if $store.status === 'error'}
		<div class="p-4 text-sm text-destructive">퀘스트를 불러오는데 실패했습니다.</div>
	{:else if $store.data && $store.data.length > 0}
		<ItemGroup class="gap-1">
			{#each $store.data as quest (quest.id)}
				<Item class={cn('p-2 px-4', { 'bg-accent': quest.id === currentQuestId })}>
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
