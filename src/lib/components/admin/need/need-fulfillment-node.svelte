<script lang="ts">
	import type { NeedFulfillment } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useItem } from '$lib/hooks/use-item';

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
				return building ? `${building.name} 사용` : '건물 미선택';
			}
			case 'character': {
				const character = fulfillment.character_id
					? $characterStore.data[fulfillment.character_id]
					: undefined;
				return character ? `${character.name}과 상호작용` : '캐릭터 미선택';
			}
			case 'item': {
				const item = fulfillment.item_id ? $itemStore.data[fulfillment.item_id] : undefined;
				return item ? `${item.name} 사용` : '아이템 미선택';
			}
			case 'task': {
				const count = fulfillment.task_count ?? 1;
				const condition = fulfillment.task_condition === 'created' ? '생성' : '완료';
				const duration = fulfillment.duration_ticks ?? 0;
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
			/ 시간당 증가
		</div>
	</div>
</div>
