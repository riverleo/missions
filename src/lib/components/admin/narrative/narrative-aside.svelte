<script lang="ts">
	import {
		ItemGroup,
		Item,
		ItemContent,
		ItemTitle,
		ItemDescription,
	} from '$lib/components/ui/item';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import NarrativeCreateButton from './narrative-create-button.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';

	const { store } = useNarrative();
</script>

<aside class="w-80 overflow-y-auto border-r">
	<header class="mb-4 flex h-16 items-center justify-between border-b p-4">
		<h2 class="text-lg font-semibold">내러티브</h2>
		<NarrativeCreateButton />
	</header>

	{#if $store.status === 'loading'}
		<div class="space-y-2 p-4">
			<Skeleton class="h-16 w-full" />
			<Skeleton class="h-16 w-full" />
			<Skeleton class="h-16 w-full" />
		</div>
	{:else if $store.status === 'error'}
		<div class="p-4 text-sm text-destructive">내러티브를 불러오는데 실패했습니다.</div>
	{:else if $store.data && $store.data.length > 0}
		<ItemGroup>
			{#each $store.data as narrative (narrative.id)}
				<Item>
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
		<div class="p-4 text-sm text-muted-foreground">내러티브가 없습니다.</div>
	{/if}
</aside>
