<script lang="ts">
	import type { NeedBehaviorAction } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { IconCircleDashedNumber1 } from '@tabler/icons-svelte';
	import { josa } from '$lib/utils/josa';
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

	const { store: buildingStore } = useBuilding();
	const { store: characterStore } = useCharacter();
	const { store: itemStore } = useItem();

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
		return undefined;
	});

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
		const target = targetLabel();
		const behaviorLabel = behaviorTypeLabel();

		if (action.type === 'go') {
			return target ? `${josa(target, '으로로')} 이동` : '자동 이동';
		}
		if (action.type === 'interact') {
			if (behaviorLabel) {
				return target
					? `${josa(target, '와과')} "${behaviorLabel}" 상호작용`
					: `"${behaviorLabel}" 상호작용`;
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
