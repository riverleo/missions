<script lang="ts">
	import type { WorldCharacterEntity } from './world-character-entity.svelte';
	import { CharacterSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useWorld } from '$lib/hooks/use-world';

	interface Props {
		entity: WorldCharacterEntity;
	}

	let { entity }: Props = $props();

	const { store: characterStore } = useCharacter();
	const { worldCharacterStore, selectedEntityStore } = useWorld();

	const worldCharacter = $derived($worldCharacterStore.data[entity.id]);
	const character = $derived(
		worldCharacter ? $characterStore.data[worldCharacter.character_id] : undefined
	);
	const selected = $derived($selectedEntityStore.entityId === entity.toEntityId());
</script>

{#if character}
	<div
		class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {entity.x}px; top: {entity.y}px;"
	>
		<CharacterSpriteAnimator
			characterId={character.id}
			bodyStateType="idle"
			faceStateType="idle"
			{selected}
		/>
	</div>
{/if}
