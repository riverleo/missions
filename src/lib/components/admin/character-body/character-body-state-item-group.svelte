<script lang="ts">
	import type { CharacterBodyStateType } from '$lib/types';
	import SpriteStateItemGroup from '$lib/components/admin/sprite-state-item-group.svelte';
	import CharacterBodyStateItem from './character-body-state-item.svelte';

	interface Props {
		bodyId: string;
	}

	let { bodyId }: Props = $props();

	const stateTypes: CharacterBodyStateType[] = ['idle', 'walk', 'jump', 'eating', 'sleeping'];
</script>

<SpriteStateItemGroup types={stateTypes}>
	{#snippet item(type)}
		<CharacterBodyStateItem {bodyId} type={type as CharacterBodyStateType} />
	{/snippet}
</SpriteStateItemGroup>
