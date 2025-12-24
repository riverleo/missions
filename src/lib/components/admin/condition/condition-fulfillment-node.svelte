<script lang="ts">
	import type { ConditionFulfillment } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useItem } from '$lib/hooks/use-item';

	interface Props {
		data: {
			fulfillment: ConditionFulfillment;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const fulfillment = $derived(data.fulfillment);

	const { store: characterStore } = useCharacter();
	const { store: itemStore } = useItem();

	const typeLabel = $derived(() => {
		switch (fulfillment.fulfillment_type) {
			case 'character': {
				const character = fulfillment.character_id
					? $characterStore.data[fulfillment.character_id]
					: undefined;
				return character ? `${character.name} 행동` : '모든 캐릭터';
			}
			case 'item': {
				const item = fulfillment.item_id ? $itemStore.data[fulfillment.item_id] : undefined;
				return item ? `${item.name} 사용` : '모든 아이템';
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
