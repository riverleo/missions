<script lang="ts">
	import type { Condition } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';

	interface Props {
		data: {
			condition: Condition;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const condition = $derived(data.condition);
</script>

<div class="min-w-48 rounded-sm bg-neutral-300 px-3 py-2">
	<Handle type="target" position={Position.Left} style="background-color: var(--color-blue-500)" />

	<div class="flex flex-col gap-1">
		<div class="truncate text-sm font-medium text-neutral-900">
			{condition.name}
		</div>
		<div class="text-xs text-neutral-600">
			<strong>{condition.decrease_per_tick}</strong>
			/ 틱당 감소
		</div>
	</div>

	<Handle type="source" position={Position.Right} />
	<Handle
		type="source"
		position={Position.Bottom}
		id="effect"
		style="background-color: var(--color-red-500)"
	/>
</div>
