<script lang="ts">
	import type { NeedBehaviorAction } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { IconCircleDashedNumber1 } from '@tabler/icons-svelte';
	import { josa } from '$lib/utils/josa';
	import { getBehaviorInteractTypeLabel } from '$lib/utils/state-label';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useItem } from '$lib/hooks/use-item';

	interface Props {
		data: {
			action: NeedBehaviorAction;
			parentAction?: NeedBehaviorAction;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const action = $derived(data.action);

	const { buildingStore } = useBuilding();
	const { characterStore } = useCharacter();
	const { itemStore } = useItem();

	const targetLabel = $derived(() => {
		if (action.building_id) {
			const building = $buildingStore.data[action.building_id];
			return `"${building?.name ?? '건물'}" 건물`;
		}
		if (action.character_id) {
			const character = $characterStore.data[action.character_id];
			return `"${character?.name ?? '캐릭터'}" 캐릭터`;
		}
		if (action.item_id) {
			const item = $itemStore.data[action.item_id];
			return `"${item?.name ?? '아이템'}" 아이템`;
		}
		// 명시적 대상이 없을 때 target_selection_method에 따라 레이블 생성
		if (action.target_selection_method === 'search') {
			return '새로운 탐색 대상';
		}
		if (action.target_selection_method === 'search_or_continue') {
			return '기존 선택 대상';
		}
		return undefined;
	});

	const behaviorTypeLabel = $derived(() => {
		if (!action.behavior_interact_type) return undefined;
		return getBehaviorInteractTypeLabel(action.behavior_interact_type);
	});

	const typeLabel = $derived(() => {
		const target = targetLabel();
		const behaviorLabel = behaviorTypeLabel();

		// 특정 조합에 대한 특별한 라벨
		if (
			action.type === 'interact' &&
			action.target_selection_method === 'search' &&
			action.behavior_interact_type === 'item_pick'
		) {
			return '새로운 탐색 대상 아이템 줍기';
		}
		if (
			action.type === 'interact' &&
			action.target_selection_method === 'search_or_continue' &&
			action.behavior_interact_type === 'item_pick'
		) {
			return '기존 선택 아이템 줍기';
		}

		if (action.type === 'go') {
			if (behaviorLabel && target) {
				return `${josa(behaviorLabel, '을를')} 위해 ${josa(target, '으로로')} 이동`;
			}
			if (behaviorLabel) {
				return `${josa(behaviorLabel, '을를')} 위해 이동`;
			}
			return target ? `${josa(target, '으로로')} 이동` : '자동 이동';
		}
		if (action.type === 'interact') {
			if (behaviorLabel && target) {
				return `${josa(target, '을를')} ${behaviorLabel}`;
			}
			if (behaviorLabel) {
				return `${behaviorLabel}`;
			}
			return target ? `${josa(target, '와과')} 상호작용` : '자동 상호작용';
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
