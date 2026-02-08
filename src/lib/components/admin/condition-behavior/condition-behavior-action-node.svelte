<script lang="ts">
	import { useBuilding, useCharacter, useInteraction, useItem } from '$lib/hooks';
	import type {
		ConditionBehaviorAction,
		BuildingInteractionId,
		ItemInteractionId,
		CharacterInteractionId,
	} from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { IconCircleDashedNumber1 } from '@tabler/icons-svelte';
	import { josa } from '$lib/utils/josa';
	import {
		getInteractionTargetNameString,
		getInteractionBehaviorLabelString,
	} from '$lib/utils/label';

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

	const { buildingStore, conditionFulfillmentStore } = useBuilding();
	const { characterStore } = useCharacter();
	const { itemStore } = useItem();
	const { buildingInteractionStore, characterInteractionStore, itemInteractionStore } =
		useInteraction();

	const targetLabel = $derived.by(() => {
		const target = getInteractionTargetNameString(action);
		if (target) return target;
		// 명시적 대상이 없을 때 target_selection_method에 따라 레이블 생성
		if (action.target_selection_method === 'search') {
			return '새로운 탐색 대상';
		}
		return undefined;
	});

	const behaviorTypeLabel = $derived(getInteractionBehaviorLabelString(action));

	const typeLabel = $derived.by(() => {
		const target = targetLabel;
		const behaviorLabel = behaviorTypeLabel;

		if (action.type === 'once') {
			if (behaviorLabel && target) {
				return `${josa(target, '을를')} ${behaviorLabel}`;
			}
			if (behaviorLabel) {
				return behaviorLabel;
			}
			return target ? `${josa(target, '와과')} 상호작용` : '자동 상호작용';
		}
		if (action.type === 'fulfill') {
			const fulfillment = action.condition_fulfillment_id
				? $conditionFulfillmentStore.data[action.condition_fulfillment_id]
				: undefined;
			const fulfillmentLabel = fulfillment
				? (() => {
						if (fulfillment.building_interaction_id) {
							const interaction =
								$buildingInteractionStore.data[
									fulfillment.building_interaction_id as BuildingInteractionId
								];
							const building = interaction
								? $buildingStore.data[interaction.building_id]
								: undefined;
							return building?.name ?? '건물';
						}
						if (fulfillment.item_interaction_id) {
							const interaction =
								$itemInteractionStore.data[fulfillment.item_interaction_id as ItemInteractionId];
							const item = interaction ? $itemStore.data[interaction.item_id] : undefined;
							return item?.name ?? '아이템';
						}
						if (fulfillment.character_interaction_id) {
							const interaction =
								$characterInteractionStore.data[
									fulfillment.character_interaction_id as CharacterInteractionId
								];
							const character = interaction
								? $characterStore.data[interaction.target_character_id]
								: undefined;
							return character?.name ?? '캐릭터';
						}
						return '자동';
					})()
				: '자동';
			return `${fulfillmentLabel}으로 욕구 충족`;
		}
		if (action.type === 'idle') {
			const durationLabel = action.idle_duration_ticks
				? `${action.idle_duration_ticks}틱 동안`
				: '무한히';
			return `${durationLabel} 대기`;
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
			{typeLabel}
		</div>
	</div>

	<Handle type="source" position={Position.Right} id="next" />
</div>
