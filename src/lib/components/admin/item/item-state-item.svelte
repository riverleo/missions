<script lang="ts">
	import type { ItemStateType } from '$lib/types';
	import SpriteStateItem, {
		type SpriteStateChange,
	} from '$lib/components/admin/sprite-state-item.svelte';
	import { useItem } from '$lib/hooks/use-item';
	import { getItemStateLabel } from '$lib/utils/state-label';

	interface Props {
		itemId: string;
		type: ItemStateType;
	}

	let { itemId, type }: Props = $props();

	const { store, admin } = useItem();

	const item = $derived($store.data[itemId]);
	const itemState = $derived(item?.item_states.find((s) => s.type === type));

	async function onchange(change: SpriteStateChange) {
		if (itemState) {
			await admin.updateItemState(itemState.id, itemId, change);
		} else if (change.atlas_name) {
			await admin.createItemState(itemId, { type, atlas_name: change.atlas_name });
		}
	}

	async function ondelete() {
		if (itemState) {
			await admin.removeItemState(itemState.id, itemId);
		}
	}
</script>

<SpriteStateItem {type} label={getItemStateLabel(type)} spriteState={itemState} {onchange} {ondelete} />
