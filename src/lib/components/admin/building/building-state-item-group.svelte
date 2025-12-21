<script lang="ts">
	import type { BuildingStateType } from '$lib/types';
	import SpriteStateItemGroup from '$lib/components/admin/sprite-state-item-group.svelte';
	import BuildingStateItem from './building-state-item.svelte';

	interface Props {
		buildingId: string;
	}

	let { buildingId }: Props = $props();

	const stateTypes: BuildingStateType[] = ['idle', 'damaged', 'planned'];
</script>

<SpriteStateItemGroup types={stateTypes}>
	{#snippet item(type)}
		<BuildingStateItem {buildingId} type={type as BuildingStateType} />
	{/snippet}
</SpriteStateItemGroup>
