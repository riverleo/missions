<script lang="ts">
	import { useTerrain } from '$lib/hooks/use-terrain';

	const { store } = useTerrain();
	const terrains = $derived(Object.values($store.data));
</script>

<div class="flex h-full items-center justify-center">
	{#if terrains.length === 0}
		<p class="text-sm text-muted-foreground">지형을 추가해주세요</p>
	{:else}
		<p class="text-sm text-muted-foreground">지형을 선택해주세요</p>
	{/if}
</div>
