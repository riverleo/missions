<script lang="ts">
	import type { TileId, TileStateType } from '$lib/types';
	import SpriteStateItemGroup from '$lib/components/admin/sprite-state-item-group.svelte';
	import TileStateItem from './tile-state-item.svelte';

	interface Props {
		tileId: TileId;
	}

	let { tileId }: Props = $props();

	const stateTypes: TileStateType[] = ['idle', 'damaged_1', 'damaged_2'];
</script>

<SpriteStateItemGroup types={stateTypes}>
	{#snippet item(type)}
		<TileStateItem {tileId} type={type as TileStateType} />
	{/snippet}
</SpriteStateItemGroup>
