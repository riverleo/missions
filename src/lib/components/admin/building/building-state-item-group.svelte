<script lang="ts">
	import type { BuildingId, BuildingStateType } from '$lib/types';
	import SpriteStateItemGroup from '$lib/components/admin/sprite-state-item-group.svelte';
	import BuildingStateItem from './building-state-item.svelte';

	interface Props {
		buildingId: BuildingId;
	}

	let { buildingId }: Props = $props();

	const stateTypes: BuildingStateType[] = ['idle', 'damaged', 'planning'];
</script>

<SpriteStateItemGroup types={stateTypes}>
	{#snippet item(type)}
		<BuildingStateItem {buildingId} type={type as BuildingStateType} />
	{/snippet}
</SpriteStateItemGroup>
