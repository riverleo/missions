<script lang="ts">
	import type { NeedFulfillment } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { useBuilding } from '$lib/hooks/use-building';

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

	const typeLabel = $derived(() => {
		switch (fulfillment.fulfillment_type) {
			case 'building': {
				const building = fulfillment.building_id
					? $buildingStore.data[fulfillment.building_id]
					: undefined;
				return building ? `캐릭터가 ${building.name}에서 대기` : '캐릭터가 건물에서 대기';
			}
			case 'task':
				return '플레이어가 할 일을 완료';
			case 'item':
				return '캐릭터가 아이템을 획득';
			case 'idle':
				return '캐릭터가 대기 중';
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
