<script lang="ts">
	import type { ItemStateType } from '$lib/types';
	import type { ItemId, ItemState } from '$lib/types';
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

	const { store, stateStore, admin } = useItem();

	const item = $derived($store.data[itemId as ItemId]);
	const itemStates = $derived($stateStore.data[itemId as ItemId] ?? []);
	const itemState = $derived(itemStates.find((s) => s.type === type));

	async function onchange(change: SpriteStateChange) {
		if (itemState) {
			await admin.updateItemState(itemState.id, itemId as ItemId, change);
		} else if (change.atlas_name) {
			await admin.createItemState(itemId as ItemId, { type, atlas_name: change.atlas_name });
		}
	}

	async function ondelete() {
		if (itemState) {
			await admin.removeItemState(itemState.id, itemId as ItemId);
		}
	}
</script>

<SpriteStateItem {type} label={getItemStateLabel(type)} spriteState={itemState} {onchange} {ondelete} />
