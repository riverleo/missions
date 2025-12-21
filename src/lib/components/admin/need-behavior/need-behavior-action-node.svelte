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
	const parentAction = $derived(data.parentAction);
	const isSuccessTarget = $derived(data.isSuccessTarget);

	const { store: buildingStore } = useBuilding();

	const typeLabels: Record<string, string> = {
		go: '이동',
		interact: '상호작용',
		wait: '대기',
		state: '상태',
	};

	const typeLabel = $derived(() => {
		if (action.type === 'go') {
			if (action.building_id) {
				const building = $buildingStore.data[action.building_id];
				return `${building?.name ?? '건물'}으로 이동`;
			}
			return '자동 이동';
		}
		if (action.type === 'interact') {
			if (action.building_id) {
				const building = $buildingStore.data[action.building_id];
				return `${building?.name ?? '건물'} 상호작용`;
			}
			return '자동 상호작용';
		}
		if (action.type === 'wait') {
			return `${action.duration_per_second}초 대기`;
		}
		if (action.type === 'state') {
			const bodyLabel = action.character_body_state_type
				? getCharacterBodyStateLabel(action.character_body_state_type)
				: undefined;
			const faceLabel = action.character_face_state_type
				? getCharacterFaceStateLabel(action.character_face_state_type)
				: undefined;
			const stateLabel = [bodyLabel, faceLabel].filter(Boolean).join(' + ') || '상태';
			return `${stateLabel} (${action.duration_per_second}초)`;
		}
		return action.type;
	});

	const description = $derived(() => {
		if (action.root) {
			return '시작 액션';
		}
		if (parentAction) {
			const parentType = typeLabels[parentAction.type] ?? parentAction.type;
			const result = isSuccessTarget ? '성공' : '실패';
			return `${parentType} ${result} 시 실행`;
		}
		return '';
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
		{#if description()}
			<div class="text-xs text-neutral-400">
				{description()}
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
