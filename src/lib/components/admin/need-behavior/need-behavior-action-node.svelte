<script lang="ts">
	import type { NeedBehaviorAction } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { IconCircleDashedNumber1 } from '@tabler/icons-svelte';
	import { useBuilding } from '$lib/hooks/use-building';
	import { getCharacterBodyStateLabel, getCharacterFaceStateLabel } from '$lib/utils/state-label';

	interface Props {
		data: {
			action: NeedBehaviorAction;
			parentAction?: NeedBehaviorAction;
			isSuccessTarget?: boolean;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const action = $derived(data.action);

	const { store: buildingStore } = useBuilding();

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
		if (action.type === 'go') {
			if (action.building_id) {
				const building = $buildingStore.data[action.building_id];
				return `"${building?.name ?? '건물'}" 건물로 이동`;
			}
			return '자동 이동';
		}
		if (action.type === 'interact') {
			if (action.building_id) {
				const building = $buildingStore.data[action.building_id];
				return `"${building?.name ?? '건물'}" 건물과 상호작용`;
			}
			return '자동 상호작용';
		}
		if (action.type === 'wait' || action.type === 'state') {
			return `${action.duration_per_second}초 대기`;
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
		{#if stateLabel()}
			<div class="text-xs text-neutral-500">
				{stateLabel()}
			</div>
		{/if}
	</div>

	{#if action.type === 'go' || action.type === 'interact'}
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
