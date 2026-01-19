<script lang="ts">
	import type { ItemBehaviorId, ItemBehaviorActionId } from '$lib/types';
	import type { ItemBehaviorAction } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { IconCircleDashedNumber1 } from '@tabler/icons-svelte';
	import { getCharacterBodyStateLabel, getCharacterFaceStateLabel } from '$lib/utils/state-label';

	interface Props {
		data: {
			action: ItemBehaviorAction;
			parentAction?: ItemBehaviorAction;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const action = $derived(data.action);

	// 바디/표정 상태 라벨 생성
	const stateLabel = $derived(() => {
		const bodyLabel = action.character_body_state_type
			? getCharacterBodyStateLabel(action.character_body_state_type)
			: undefined;
		const faceLabel = action.character_face_state_type
			? getCharacterFaceStateLabel(action.character_face_state_type)
			: undefined;
		return [bodyLabel, faceLabel].filter(Boolean).join(' + ');
	});

	const typeLabel = $derived(() => {
		return `${action.duration_ticks}틱 대기`;
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
		{#if stateLabel()}
			<div class="text-xs text-neutral-500">
				{stateLabel()}
			</div>
		{/if}
	</div>

	<Handle type="source" position={Position.Right} id="next" />
</div>
