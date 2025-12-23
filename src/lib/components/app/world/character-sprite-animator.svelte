<script lang="ts">
	import type { WorldCharacter } from '$lib/types';
	import { CharacterSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { useWorld } from '$lib/hooks/use-world.svelte';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useCharacterBody } from '$lib/hooks/use-character-body';

	interface Props {
		worldCharacter: WorldCharacter;
	}

	let { worldCharacter }: Props = $props();

	const world = useWorld();
	const { store: characterStore, faceStateStore } = useCharacter();
	const { store: characterBodyStore, bodyStateStore } = useCharacterBody();

	// 물리 바디에서 위치 가져오기
	const body = $derived(world.characterBodies[worldCharacter.id]);
	const x = $derived(body?.position.x ?? 0);
	const y = $derived(body?.position.y ?? 0);
	const angle = $derived(body?.position.angle ?? 0);

	// 캐릭터 -> 바디 -> 바디 상태 조회
	const character = $derived($characterStore.data[worldCharacter.character_id]);
	const characterBody = $derived(character ? $characterBodyStore.data[character.body_id] : undefined);
	const bodyStates = $derived(characterBody ? ($bodyStateStore.data[characterBody.id] ?? []) : []);
	const bodyIdleState = $derived(bodyStates.find((s) => s.type === 'idle'));

	// 캐릭터 -> 얼굴 상태 조회
	const faceStates = $derived(character ? ($faceStateStore.data[character.id] ?? []) : []);
	const faceNeutralState = $derived(faceStates.find((s) => s.type === 'idle'));

	// 월드 좌표를 퍼센트로 변환 (부모 월드 레이어 기준)
	const left = $derived(`${(x / world.terrainBody.width) * 100}%`);
	const top = $derived(`${(y / world.terrainBody.height) * 100}%`);
	const rotation = $derived(`${angle}rad`);
</script>

<div
	class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
	style="left: {left}; top: {top}; rotate: {rotation};"
>
	{#if bodyIdleState}
		<CharacterSpriteAnimator bodyState={bodyIdleState} faceState={faceNeutralState} resolution={2} />
	{/if}
</div>
