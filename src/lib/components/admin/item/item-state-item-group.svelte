<script lang="ts">
	import type { ItemStateType } from '$lib/types';
	import SpriteStateItemGroup from '$lib/components/admin/sprite-state-item-group.svelte';
	import ItemStateItem from './item-state-item.svelte';

	interface Props {
		itemId: string;
	}

	let { itemId }: Props = $props();

	const stateTypes: ItemStateType[] = ['idle', 'rotten'];
</script>

<SpriteStateItemGroup types={stateTypes}>
	{#snippet item(type)}
		<ItemStateItem {itemId} type={type as ItemStateType} />
	{/snippet}
</SpriteStateItemGroup>
