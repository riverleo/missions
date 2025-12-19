<script lang="ts">
	import type { NeedFulfillment } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';

	interface Props {
		data: {
			fulfillment: NeedFulfillment;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const fulfillment = $derived(data.fulfillment);

	const typeLabel = $derived(() => {
		switch (fulfillment.fulfillment_type) {
			case 'building':
				return '건물';
			case 'task':
				return '작업';
			case 'item':
				return '아이템';
			case 'idle':
				return '휴식';
			default:
				return fulfillment.fulfillment_type;
		}
	});
</script>

<div class="px-3 py-2">
	<Handle type="target" position={Position.Left} />

	<div class="flex items-center gap-2">
		<span class="text-xs text-neutral-400">{typeLabel()}</span>
		<span class="text-sm font-medium text-white">+{fulfillment.amount}</span>
	</div>
</div>
