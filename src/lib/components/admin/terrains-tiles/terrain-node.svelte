<script lang="ts">
	import type { Terrain } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';

	interface Props {
		data: {
			terrain: Terrain;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const terrain = $derived(data.terrain);
</script>

<div class="px-3 py-2">
	<span class="flex-1 truncate text-sm font-medium text-white">
		{terrain.title}
	</span>

	<Handle type="source" position={Position.Right} />
</div>
