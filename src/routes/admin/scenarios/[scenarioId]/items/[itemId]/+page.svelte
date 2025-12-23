<script lang="ts">
	import { page } from '$app/state';
	import { useItem } from '$lib/hooks/use-item';
	import ItemStateItemGroup from '$lib/components/admin/item/item-state-item-group.svelte';
	import type { ItemId } from '$lib/types';

	const { store } = useItem();
	const itemId = $derived(page.params.itemId as ItemId);
	const item = $derived(itemId ? $store.data[itemId] : undefined);
</script>

{#if item && itemId}
	<div class="flex h-full flex-col">
		<div class="flex p-4 pt-16">
			<ItemStateItemGroup {itemId} />
		</div>
	</div>
{:else}
	<div class="flex h-full items-center justify-center">
		<p class="text-sm text-muted-foreground">아이템을 찾을 수 없습니다</p>
	</div>
{/if}
