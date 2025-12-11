<script lang="ts">
	import { ItemGroup, Item, ItemContent, ItemTitle } from '$lib/components/ui/item';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';

	const { store } = useNarrative();
	const currentNarrativeId = $derived($page.params.narrativeId);
</script>

<aside class="w-60 overflow-y-auto border-r bg-muted/30 p-2">
	{#if $store.status === 'loading'}
		<div class="space-y-2 p-4">
			<Skeleton class="h-16 w-full" />
			<Skeleton class="h-16 w-full" />
			<Skeleton class="h-16 w-full" />
		</div>
	{:else if $store.status === 'error'}
		<div class="p-4 text-sm text-destructive">대화 또는 효과를 불러오는데 실패했습니다.</div>
	{:else if $store.data && $store.data.length > 0}
		<ItemGroup class="gap-1">
			{#each $store.data as narrative (narrative.id)}
				<Item class={cn('p-2 px-4', { 'bg-accent': narrative.id === currentNarrativeId })}>
					{#snippet child({ props })}
						<a href={`/admin/narratives/${narrative.id}`} {...props}>
							<ItemContent>
								<ItemTitle>{narrative.title}</ItemTitle>
							</ItemContent>
						</a>
					{/snippet}
				</Item>
			{/each}
		</ItemGroup>
	{:else}
		<div class="p-4 text-sm text-muted-foreground">대화 또는 효과가 없습니다.</div>
	{/if}
</aside>
