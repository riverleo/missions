<script lang="ts">
	import type { CharacterFaceStateType } from '$lib/types';
	import SpriteStateItemGroup from '$lib/components/admin/sprite-state-item-group.svelte';
	import CharacterStateItem from './character-state-item.svelte';

	interface Props {
		characterId: string;
	}

	let { characterId }: Props = $props();

	const stateTypes: CharacterFaceStateType[] = ['neutral', 'happy', 'sad', 'angry'];
</script>

<SpriteStateItemGroup types={stateTypes}>
	{#snippet item(type)}
		<CharacterStateItem {characterId} type={type as CharacterFaceStateType} />
	{/snippet}
</SpriteStateItemGroup>
