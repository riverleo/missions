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

	const behaviorTypeLabel = $derived(() => {
		if (!action.character_behavior_type) return undefined;

		const labels: Record<string, string> = {
			demolish: '철거',
			use: '사용',
			repair: '수리',
			clean: '청소',
			pick: '줍기',
		};

		return labels[action.character_behavior_type];
	});

	const typeLabel = $derived(() => {
		const behaviorLabel = behaviorTypeLabel();

		if (action.type === 'go') {
			return '해당 건물로 이동';
		}
		if (action.type === 'interact') {
			return behaviorLabel ? `해당 건물과 "${behaviorLabel}" 상호작용` : '해당 건물과 상호작용';
		}
		if (action.type === 'idle') {
			return `대기 ${action.duration_ticks}틱`;
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
