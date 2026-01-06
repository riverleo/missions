<script lang="ts">
	import { useTerrain } from '$lib/hooks/use-terrain';

	const { tileStore } = useTerrain();
	const tiles = $derived(Object.values($tileStore.data));
</script>

<div class="flex h-full items-center justify-center">
	{#if tiles.length === 0}
		<p class="text-sm text-muted-foreground">타일을 추가해주세요</p>
	{:else}
		<p class="text-sm text-muted-foreground">타일을 선택해주세요</p>
	{/if}
</div>
