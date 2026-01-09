<script lang="ts">
	import type { CharacterId, CharacterFaceStateType } from '$lib/types';
	import SpriteStateItemGroup from '$lib/components/admin/sprite-state-item-group.svelte';
	import CharacterFaceStateItem from './character-face-state-item.svelte';

	interface Props {
		characterId: CharacterId;
	}

	let { characterId }: Props = $props();

	const stateTypes: CharacterFaceStateType[] = ['idle', 'happy', 'sad', 'angry'];
</script>

<SpriteStateItemGroup types={stateTypes}>
	{#snippet item(type)}
		<CharacterFaceStateItem {characterId} type={type as CharacterFaceStateType} />
	{/snippet}
</SpriteStateItemGroup>
