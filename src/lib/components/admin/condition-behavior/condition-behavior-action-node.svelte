<script lang="ts">
	import type { ConditionBehaviorAction } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { IconCircleDashedNumber1 } from '@tabler/icons-svelte';

	interface Props {
		data: {
			action: ConditionBehaviorAction;
			parentAction?: ConditionBehaviorAction;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const action = $derived(data.action);

	const typeLabel = $derived(() => {
		if (action.type === 'go') {
			return '자동 이동';
		}
		if (action.type === 'interact') {
			return '자동 상호작용';
		}
		if (action.type === 'idle') {
			return action.duration_ticks === 0 ? '즉시 다음' : `${action.duration_ticks}틱 대기`;
		}
		return action.type;
	});
</script>

<div class="min-w-44 px-3 py-2">
	{#if !action.root}
		<Handle
			type="target"
			position={Position.Left}
			id="target"
			style="background-color: var(--color-neutral-500)"
		/>
	{/if}

	<div class="flex flex-col">
		<div class="flex items-center gap-1 text-sm font-medium">
			{#if action.root}
				<IconCircleDashedNumber1 class="size-3.5" />
			{/if}
			{typeLabel()}
		</div>
	</div>

	<Handle type="source" position={Position.Right} id="next" />
</div>
