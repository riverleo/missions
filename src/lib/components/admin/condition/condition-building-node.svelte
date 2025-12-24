<script lang="ts">
	import type { Building } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';

	interface Props {
		data: {
			building: Building;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const building = $derived(data.building);
</script>

<div class="px-3 py-2">
	<span class="flex-1 truncate text-sm font-medium text-white">
		{building.name}
	</span>

	<Handle type="source" position={Position.Right} style="background-color: var(--color-blue-500)" />
</div>
