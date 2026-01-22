<script lang="ts">
	import { useItem } from '$lib/hooks/use-item';

	const { itemStore } = useItem();
	const items = $derived(Object.values($itemStore.data));
</script>

<div class="flex h-full items-center justify-center">
	{#if items.length === 0}
		<p class="text-sm text-muted-foreground">아이템을 추가해주세요</p>
	{:else}
		<p class="text-sm text-muted-foreground">아이템을 선택해주세요</p>
	{/if}
</div>
