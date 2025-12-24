<script lang="ts">
	import type { ConditionFulfillment } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useItem } from '$lib/hooks/use-item';
	import { getCharacterBehaviorTypeLabel } from '$lib/utils/state-label';

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
		const behaviorLabel = getCharacterBehaviorTypeLabel(fulfillment.character_behavior_type);

		switch (fulfillment.fulfillment_type) {
			case 'character': {
				const character = fulfillment.character_id
					? $characterStore.data[fulfillment.character_id]
					: undefined;
				return character ? `${character.name} ${behaviorLabel}` : `모든 캐릭터 ${behaviorLabel}`;
			}
			case 'item': {
				const item = fulfillment.item_id ? $itemStore.data[fulfillment.item_id] : undefined;
				return item ? `${item.name} ${behaviorLabel}` : `모든 아이템 ${behaviorLabel}`;
			}
			case 'idle':
				return `${behaviorLabel} 중 대기`;
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
