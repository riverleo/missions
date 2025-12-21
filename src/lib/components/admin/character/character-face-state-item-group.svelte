<script lang="ts">
	import type { CharacterFaceStateType } from '$lib/types';
	import SpriteStateItemGroup from '$lib/components/admin/sprite-state-item-group.svelte';
	import CharacterFaceStateItem from './character-face-state-item.svelte';

	interface Props {
		characterId: string;
	}

	let { characterId }: Props = $props();

	const stateTypes: CharacterFaceStateType[] = ['neutral', 'happy', 'sad', 'angry'];
</script>

<SpriteStateItemGroup types={stateTypes}>
	{#snippet item(type)}
		<CharacterFaceStateItem {characterId} type={type as CharacterFaceStateType} />
	{/snippet}
</SpriteStateItemGroup>
