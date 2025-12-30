<script lang="ts">
	import type { WorldCharacterEntity } from './world-character-entity.svelte';
	import { CharacterSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useCharacterBody } from '$lib/hooks/use-character-body';
	import { useWorld } from '$lib/hooks/use-world.svelte';

	interface Props {
		entity: WorldCharacterEntity;
	}

	let { entity }: Props = $props();

	const world = useWorld();
	const { terrainBody } = world;
	const { store: characterStore, faceStateStore } = useCharacter();
	const { store: characterBodyStore, bodyStateStore } = useCharacterBody();

	const worldCharacter = $derived(world.characters[entity.id]);
	const character = $derived(
		worldCharacter ? $characterStore.data[worldCharacter.character_id] : undefined
	);
	const characterBody = $derived(
		character ? $characterBodyStore.data[character.body_id] : undefined
	);
	const bodyStates = $derived(characterBody ? ($bodyStateStore.data[characterBody.id] ?? []) : []);
	const bodyState = $derived(bodyStates.find((s) => s.type === 'idle'));
	const faceStates = $derived(character ? ($faceStateStore.data[character.id] ?? []) : []);
	const faceState = $derived(faceStates.find((s) => s.type === 'idle'));

	// 월드 좌표를 퍼센트로 변환 (부모 월드 레이어 기준)
	const left = $derived(`${(entity.x / terrainBody.width) * 100}%`);
	const top = $derived(`${(entity.y / terrainBody.height) * 100}%`);
	const rotation = $derived(`${entity.angle}rad`);
</script>

{#if bodyState}
	<div
		class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {left}; top: {top}; rotate: {rotation};"
	>
		<CharacterSpriteAnimator {bodyState} {faceState} />
	</div>
{/if}
