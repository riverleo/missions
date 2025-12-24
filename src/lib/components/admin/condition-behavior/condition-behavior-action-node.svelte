<script lang="ts">
	import type { ConditionBehaviorAction } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { IconCircleDashedNumber1 } from '@tabler/icons-svelte';
	import { getCharacterBodyStateLabel, getCharacterFaceStateLabel } from '$lib/utils/state-label';

	interface Props {
		data: {
			action: ConditionBehaviorAction;
			parentAction?: ConditionBehaviorAction;
			isSuccessTarget?: boolean;
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

	const durationLabel = $derived(() => {
		if (action.duration_ticks > 0) {
			return `${action.duration_ticks}틱`;
		}
		return undefined;
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
			{#if stateLabel()}
				{stateLabel()}
			{:else}
				<span class="text-neutral-400">캐릭터 상태 미설정</span>
			{/if}
		</div>
		{#if durationLabel()}
			<div class="text-xs text-neutral-500">
				{durationLabel()}
			</div>
		{/if}
	</div>

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
</div>
