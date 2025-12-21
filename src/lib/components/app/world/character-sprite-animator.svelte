<script lang="ts">
	import type { WorldCharacter } from '$lib/types';
	import { CharacterSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { useWorld } from '$lib/hooks/use-world.svelte';

	interface Props {
		worldCharacter: WorldCharacter;
		x: number;
		y: number;
		angle?: number;
	}

	let { worldCharacter, x, y, angle = 0 }: Props = $props();

	const world = useWorld();

	// body의 idle 상태 가져오기
	const bodyIdleState = $derived(
		worldCharacter.character.character_body?.character_body_states.find((s) => s.type === 'idle')
	);

	// face의 neutral 상태 가져오기
	const faceNeutralState = $derived(
		worldCharacter.character.character_face_states?.find((s) => s.type === 'neutral')
	);

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
