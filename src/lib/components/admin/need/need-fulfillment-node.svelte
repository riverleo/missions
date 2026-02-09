<script lang="ts">
	import { useBuilding, useCharacter, useInteraction, useItem } from '$lib/hooks';
	import type {
		NeedFulfillment,
		BuildingInteractionId,
		ItemInteractionId,
		CharacterInteractionId,
	} from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { getBehaviorInteractTypeString } from '$lib/utils/label';

	interface Props {
		data: {
			fulfillment: NeedFulfillment;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const fulfillment = $derived(data.fulfillment);

	const { getOrUndefinedBuilding } = useBuilding();
	const { getOrUndefinedCharacter } = useCharacter();
	const { getOrUndefinedItem } = useItem();
	const {
		getOrUndefinedBuildingInteraction,
		getOrUndefinedCharacterInteraction,
		getOrUndefinedItemInteraction,
	} = useInteraction();

	const typeLabel = $derived(() => {
		// Interaction 기반
		if (fulfillment.building_interaction_id) {
			const interaction = getOrUndefinedBuildingInteraction(
				fulfillment.building_interaction_id as BuildingInteractionId
			);
			if (interaction) {
				const building = getOrUndefinedBuilding(interaction.building_id);
				const interactionType =
					interaction.once_interaction_type || interaction.fulfill_interaction_type;
				const behaviorLabel = interactionType ? getBehaviorInteractTypeString(interactionType) : '';
				return `${building?.name ?? '건물'} ${behaviorLabel}`;
			}
		}
		if (fulfillment.item_interaction_id) {
			const interaction = getOrUndefinedItemInteraction(
				fulfillment.item_interaction_id as ItemInteractionId
			);
			if (interaction) {
				const item = getOrUndefinedItem(interaction.item_id);
				const interactionType =
					interaction.once_interaction_type || interaction.fulfill_interaction_type;
				const behaviorLabel = interactionType ? getBehaviorInteractTypeString(interactionType) : '';
				return `${item?.name ?? '아이템'} ${behaviorLabel}`;
			}
		}
		if (fulfillment.character_interaction_id) {
			const interaction = getOrUndefinedCharacterInteraction(
				fulfillment.character_interaction_id as CharacterInteractionId
			);
			if (interaction) {
				const character = getOrUndefinedCharacter(interaction.target_character_id);
				const interactionType =
					interaction.once_interaction_type || interaction.fulfill_interaction_type;
				const behaviorLabel = interactionType ? getBehaviorInteractTypeString(interactionType) : '';
				return `${character?.name ?? '캐릭터'} ${behaviorLabel}`;
			}
		}

		// Legacy fulfillment_type 기반 (task, idle)
		switch (fulfillment.fulfillment_type) {
			case 'task': {
				const count = fulfillment.task_count ?? 1;
				const condition = fulfillment.task_condition === 'created' ? '생성' : '완료';
				const duration = fulfillment.task_duration_ticks ?? 0;
				return duration > 0
					? `할 일 ${count}개 ${condition} (${duration}틱)`
					: `할 일 ${count}개 ${condition}`;
			}
			default:
				return '상호작용 없음';
		}
	});
</script>

<div class="min-w-48 px-3 py-2">
	<Handle type="target" position={Position.Left} />

	<div class="flex flex-col gap-1">
		<div class="truncate text-sm font-medium">
			{typeLabel()}
		</div>
		<div class="text-xs text-muted-foreground">
			<strong>{fulfillment.increase_per_tick}</strong>
			/ 틱당 증가
		</div>
	</div>
</div>
