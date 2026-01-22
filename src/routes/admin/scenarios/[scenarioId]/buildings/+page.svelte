<script lang="ts">
	import { useBuilding } from '$lib/hooks/use-building';

	const { buildingStore } = useBuilding();
	const buildings = $derived(Object.values($buildingStore.data));
</script>

<div class="flex h-full items-center justify-center">
	{#if buildings.length === 0}
		<p class="text-sm text-muted-foreground">건물을 추가해주세요</p>
	{:else}
		<p class="text-sm text-muted-foreground">건물을 선택해주세요</p>
	{/if}
</div>
