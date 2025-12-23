<script lang="ts">
	import type { CharacterBodyState, CharacterFaceState } from '$lib/types';
	import { CharacterSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { useWorld } from '$lib/hooks/use-world.svelte';

	interface Props {
		x: number;
		y: number;
		angle?: number;
		characterBodyState: CharacterBodyState;
		characterFaceState?: CharacterFaceState;
	}

	let { x, y, angle = 0, characterBodyState, characterFaceState }: Props = $props();

	const world = useWorld();

	// 월드 좌표를 퍼센트로 변환 (부모 월드 레이어 기준)
	const left = $derived(`${(x / world.terrainBody.width) * 100}%`);
	const top = $derived(`${(y / world.terrainBody.height) * 100}%`);
	const rotation = $derived(`${angle}rad`);
</script>

<div
	class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
	style="left: {left}; top: {top}; rotate: {rotation};"
>
	<CharacterSpriteAnimator bodyState={characterBodyState} faceState={characterFaceState} />
</div>
