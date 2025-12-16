<script lang="ts">
	import type { BuildingStateType } from '$lib/types';
	import { ItemGroup } from '$lib/components/ui/item';
	import BuildingStateItem from './building-state-item.svelte';

	interface Props {
		buildingId: string;
	}

	let { buildingId }: Props = $props();

	const stateTypes: BuildingStateType[] = ['idle', 'damaged', 'planned'];
</script>

<ItemGroup class="grid grid-cols-4 gap-4">
	{#each stateTypes as type (type)}
		<BuildingStateItem {buildingId} {type} />
	{/each}
</ItemGroup>
