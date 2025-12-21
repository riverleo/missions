<script lang="ts">
	import type { NeedBehaviorAction } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { getCharacterStateLabel } from '$lib/utils/state-label';

	interface Props {
		data: {
			action: NeedBehaviorAction;
			isRoot?: boolean;
			parentAction?: NeedBehaviorAction;
			isSuccessTarget?: boolean;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const action = $derived(data.action);
	const isRoot = $derived(data.isRoot);
	const parentAction = $derived(data.parentAction);
	const isSuccessTarget = $derived(data.isSuccessTarget);

	const typeLabels: Record<string, { label: string }> = {
		go_to: { label: '이동' },
		wait: { label: '대기' },
		state: { label: '상태' },
	};

	const description = $derived(() => {
		if (isRoot) {
			return '최초 실행';
		}
		if (parentAction) {
			const parentType = typeLabels[parentAction.type]?.label ?? parentAction.type;
			const result = isSuccessTarget ? '성공' : '실패';
			return `${parentType} ${result} 시 ${action.order_in_need_behavior}순위 실행`;
		}
		return `${action.order_in_need_behavior}순위 실행`;
	});
</script>

<div class="min-w-44 px-3 py-2">
	<Handle
		type="target"
		position={Position.Left}
		id="target"
		style="background-color: var(--color-neutral-500)"
	/>

	<div class="flex flex-col">
		<div class="text-sm font-medium">
			{typeLabels[action.type]?.label}
		</div>
		<div class="text-xs text-neutral-400">
			{description()}
		</div>
	</div>

	{#if action.type === 'go_to'}
		<Handle
			type="source"
			position={Position.Right}
			id="success"
			style="background-color: var(--color-green-500); top: 30%"
		/>
		<Handle
			type="source"
			position={Position.Right}
			id="failure"
			style="background-color: var(--color-red-500); top: 70%"
		/>
	{:else}
		<Handle
			type="source"
			position={Position.Right}
			id="success"
			style="background-color: var(--color-green-500)"
		/>
	{/if}
</div>
