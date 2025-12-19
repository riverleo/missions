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

<div class="min-w-48 rounded-sm bg-neutral-300 px-3 py-2">
	<Handle type="target" position={Position.Left} style="background-color: var(--color-blue-500)" />

	<div class="flex flex-col gap-1">
		<div class="truncate text-sm font-medium text-neutral-900">
			{need.name}
		</div>
		<div class="text-xs text-neutral-600">
			<strong>{need.decrease_per_tick}</strong>
			/ 시간당 감소
		</div>
	</div>

	<Handle type="source" position={Position.Right} />
</div>
