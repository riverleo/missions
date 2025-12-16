<script lang="ts">
	import { page } from '$app/state';
	import { useBuilding } from '$lib/hooks/use-building';
	import BuildingPanel from '$lib/components/admin/building/building-panel.svelte';
	import BuildingStateList from '$lib/components/admin/building/building-state-list.svelte';

	const { store } = useBuilding();
	const buildingId = $derived(page.params.buildingId);
	const building = $derived(buildingId ? $store.data[buildingId] : undefined);
</script>

{#if building && buildingId}
	<div class="flex h-full flex-col">
		<div class="flex flex-1 items-center justify-center overflow-auto p-4">
			<BuildingStateList {buildingId} />
		</div>
		<BuildingPanel {building} />
	</div>
{:else}
	<div class="flex h-full items-center justify-center">
		<p class="text-muted-foreground text-sm">건물을 찾을 수 없습니다</p>
	</div>
{/if}
