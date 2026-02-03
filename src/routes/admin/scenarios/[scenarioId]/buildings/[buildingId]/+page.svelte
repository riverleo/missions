<script lang="ts">
	import { useBuilding } from '$lib/hooks';
	import { page } from '$app/state';
	import BuildingPanel from '$lib/components/admin/building/building-action-panel.svelte';
	import BuildingStateItemGroup from '$lib/components/admin/building/building-state-item-group.svelte';
	import type { BuildingId } from '$lib/types';

	const { buildingStore } = useBuilding();
	const buildingId = $derived(page.params.buildingId as BuildingId);
	const building = $derived(buildingId ? $buildingStore.data[buildingId] : undefined);
</script>

{#if building && buildingId}
	<div class="flex h-full flex-col">
		<div class="flex p-4 pt-16">
			<BuildingStateItemGroup {buildingId} />
		</div>
		<BuildingPanel {building} />
	</div>
{:else}
	<div class="flex h-full items-center justify-center">
		<p class="text-sm text-muted-foreground">건물을 찾을 수 없습니다</p>
	</div>
{/if}
