<script lang="ts">
	import type { Need } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { IconHeart } from '@tabler/icons-svelte';

	interface Props {
		data: {
			need: Need;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const need = $derived(data.need);
</script>

<div class="w-40 rounded-md border border-neutral-700 bg-neutral-800">
	<div class="relative px-3 py-2">
		<Handle type="target" position={Position.Left} />

		<div class="flex items-center gap-2">
			<IconHeart class="size-4 text-red-400" />
			<span class="flex-1 truncate text-sm font-medium text-white">
				{need.name}
			</span>
		</div>

		<div class="mt-1 text-xs text-neutral-400">
			감소: {need.decay_per_tick}/tick
		</div>

		<Handle type="source" position={Position.Right} />
	</div>
</div>
