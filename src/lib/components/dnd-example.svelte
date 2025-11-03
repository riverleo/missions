<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';

	import Tile from './Tile.svelte';
	import Square from './Square.svelte';

	let idx = 0;

	let items = [
		{ id: idx++, letter: 'A' },
		{ id: idx++, letter: 'B' },
		{ id: idx++, letter: 'C' },
		{ id: idx++, letter: 'D' },
		{ id: idx++, letter: 'E' },
		{ id: idx++, letter: 'F' },
		{ id: idx++, letter: 'G' },
	];

	function handleDnd(e: { detail: { items: { id: number; letter: string }[] } }) {
		items = e.detail.items;
	}

	// of type { id: number }[][];
	const boardGrid = Array.from({ length: 15 }, (_, i) =>
		Array.from({ length: 15 }, (_, j) => ({ id: i * 15 + j }))
	);

	const flipDurationMs = 10;

	$: options = {
		items,
		flipDurationMs,
		morphDisabled: true,
	};
</script>

<div class="game-container">
	<div class="grid">
		{#each boardGrid as col}
			<div class="col">
				{#each col as square}
					<Square />
				{/each}
			</div>
		{/each}
	</div>

	<div class="rack" use:dndzone={options} on:consider={handleDnd} on:finalize={handleDnd}>
		{#each items as item (item.id)}
			<div animate:flip={{ duration: flipDurationMs }}>
				<Tile letter={item.letter} />
			</div>
		{/each}
	</div>
</div>

<style>
	.game-container {
		display: flex;
		height: 100%;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	.grid {
		display: flex;
		flex-direction: row;
		justify-content: center;
	}

	.col {
		display: flex;
		flex-direction: column;
	}

	.rack {
		display: flex;
		justify-content: flex-start;
		flex-grow: 0;
		width: calc((min(5vmin, 50px) + 4px) * 7);
		height: calc(2px + min(5vmin, 50px));
	}

	.rack > * {
		margin: 2px;
	}
</style>
