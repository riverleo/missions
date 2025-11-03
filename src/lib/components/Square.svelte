<script lang="ts">
	import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME, type DndEvent } from 'svelte-dnd-action';
	import Tile from './Tile.svelte';

	let items: any[] = [];

	function handleDnd(e: CustomEvent<DndEvent>) {
		items = e.detail.items;
	}

	$: options = {
		dropFromOthersDisabled: items.length > 0,
		items,
		dropTargetStyle: {},
		flipDurationMs: 100,
	};
</script>

<div
	class="square"
	style={items.find((tile) => tile[SHADOW_ITEM_MARKER_PROPERTY_NAME])
		? 'background: rgba(255, 255, 255, 0.2)'
		: ''}
	use:dndzone={options}
	onconsider={handleDnd}
	onfinalize={handleDnd}
>
	{#each items as tile (tile.id)}
		<Tile letter={tile.letter} />
	{/each}
</div>

<style>
	.square {
		height: calc(2px + min(5vmin, 50px));
		width: calc(2px + min(5vmin, 50px));
	}
</style>
