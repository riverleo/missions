<script lang="ts">
	import type { NeedFulfillment } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useItem } from '$lib/hooks/use-item';
	import { getCharacterBehaviorTypeLabel } from '$lib/utils/state-label';

	interface Props {
		data: {
			fulfillment: NeedFulfillment;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const fulfillment = $derived(data.fulfillment);

	const { store: buildingStore } = useBuilding();
	const { store: characterStore } = useCharacter();
	const { store: itemStore } = useItem();

	const typeLabel = $derived(() => {
		switch (fulfillment.fulfillment_type) {
			case 'building': {
				const building = fulfillment.building_id
					? $buildingStore.data[fulfillment.building_id]
					: undefined;
				const behaviorLabel = getCharacterBehaviorTypeLabel(fulfillment.character_behavior_type);
				const buildingName = building?.name ?? '모든 건물';
				return `${buildingName} ${behaviorLabel}`;
			}
			case 'character': {
				const character = fulfillment.character_id
					? $characterStore.data[fulfillment.character_id]
					: undefined;
				const behaviorLabel = getCharacterBehaviorTypeLabel(fulfillment.character_behavior_type);
				const characterName = character?.name ?? '모든 캐릭터';
				return `${characterName} ${behaviorLabel}`;
			}
			case 'item': {
				const item = fulfillment.item_id ? $itemStore.data[fulfillment.item_id] : undefined;
				const behaviorLabel = getCharacterBehaviorTypeLabel(fulfillment.character_behavior_type);
				const itemName = item?.name ?? '모든 아이템';
				return `${itemName} ${behaviorLabel}`;
			}
			case 'task': {
				const count = fulfillment.task_count ?? 1;
				const condition = fulfillment.task_condition === 'created' ? '생성' : '완료';
				const duration = fulfillment.task_duration_ticks ?? 0;
				return duration > 0
					? `할 일 ${count}개 ${condition} (${duration}틱)`
					: `할 일 ${count}개 ${condition}`;
			}
			case 'idle':
				return '대기';
			default:
				return fulfillment.fulfillment_type;
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
