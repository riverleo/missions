<script lang="ts">
	import type { Building } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { IconBuilding } from '@tabler/icons-svelte';

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

<div class="w-36 rounded-md border border-neutral-700 bg-neutral-900">
	<div class="relative px-3 py-2">
		<Handle type="target" position={Position.Left} />

		<div class="flex items-center gap-2">
			<IconBuilding class="size-4 text-green-400" />
			<span class="flex-1 truncate text-sm font-medium text-white">
				{building.name}
			</span>
		</div>
	</div>
</div>
