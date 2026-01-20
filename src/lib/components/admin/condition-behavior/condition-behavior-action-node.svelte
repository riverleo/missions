<script lang="ts">
	import type { ConditionBehaviorAction } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { IconCircleDashedNumber1 } from '@tabler/icons-svelte';
	import { getCharacterFaceStateLabel } from '$lib/utils/state-label';

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

	// 표정 상태 라벨 생성
	const faceLabel = $derived(() => {
		return action.character_face_state_type
			? getCharacterFaceStateLabel(action.character_face_state_type)
			: undefined;
	});

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
		{#if faceLabel()}
			<div class="text-xs text-neutral-500">
				{faceLabel()}
			</div>
		{/if}
	</div>

	<Handle type="source" position={Position.Right} id="next" />
</div>
