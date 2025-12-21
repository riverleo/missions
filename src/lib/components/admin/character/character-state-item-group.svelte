<script lang="ts">
	import type { CharacterStateType } from '$lib/types';
	import SpriteStateItemGroup from '$lib/components/admin/sprite-state-item-group.svelte';
	import CharacterStateItem from './character-state-item.svelte';

	interface Props {
		characterId: string;
	}

	let { characterId }: Props = $props();

	const stateTypes: CharacterStateType[] = [
		'idle',
		'walk',
		'jump',
		'eating',
		'sleeping',
		'angry',
		'sad',
		'happy',
	];
</script>

<SpriteStateItemGroup types={stateTypes}>
	{#snippet item(type)}
		<CharacterStateItem {characterId} type={type as CharacterStateType} />
	{/snippet}
</SpriteStateItemGroup>
