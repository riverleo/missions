<script lang="ts">
	import type { CharacterBodyId, CharacterBodyStateType } from '$lib/types';
	import SpriteStateItemGroup from '$lib/components/admin/sprite-state-item-group.svelte';
	import CharacterBodyStateItem from './character-body-state-item.svelte';

	interface Props {
		bodyId: CharacterBodyId;
	}

	let { bodyId }: Props = $props();

	const stateTypes: CharacterBodyStateType[] = ['idle', 'walk', 'run', 'jump', 'pick'];
</script>

<SpriteStateItemGroup types={stateTypes}>
	{#snippet item(type)}
		<CharacterBodyStateItem {bodyId} type={type as CharacterBodyStateType} />
	{/snippet}
</SpriteStateItemGroup>
