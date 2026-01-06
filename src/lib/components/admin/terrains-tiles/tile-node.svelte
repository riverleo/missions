<script lang="ts">
	import type { Tile } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';

	interface Props {
		data: {
			tile: Tile;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const tile = $derived(data.tile);
</script>

<div class="px-3 py-2">
	<span class="flex-1 truncate text-sm font-medium text-white">
		{tile.name}
	</span>

	<Handle type="target" position={Position.Left} style="background-color: var(--color-blue-500)" />
</div>
