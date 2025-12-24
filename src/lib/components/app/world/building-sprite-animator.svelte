<script lang="ts">
	import type { BuildingState, CharacterBodyState, CharacterFaceState } from '$lib/types';
	import { SpriteAnimator } from '$lib/components/app/sprite-animator/sprite-animator.svelte';
	import SpriteAnimatorRenderer from '$lib/components/app/sprite-animator/sprite-animator-renderer.svelte';
	import { CharacterSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { useWorld } from '$lib/hooks/use-world.svelte';

	interface Props {
		x: number;
		y: number;
		angle?: number;
		buildingState: BuildingState;
		characterBodyState?: CharacterBodyState;
		characterFaceState?: CharacterFaceState;
		characterOffset?: { x: number; y: number };
	}

	let {
		x,
		y,
		angle = 0,
		buildingState,
		characterBodyState,
		characterFaceState,
		characterOffset = { x: 0, y: 0 },
	}: Props = $props();

	const world = useWorld();

	let animator = $state<SpriteAnimator | undefined>(undefined);

	// 월드 좌표를 퍼센트로 변환 (부모 월드 레이어 기준)
	const left = $derived(`${(x / world.terrainBody.width) * 100}%`);
	const top = $derived(`${(y / world.terrainBody.height) * 100}%`);
	const rotation = $derived(`${angle}rad`);

	// 건물 스프라이트 프레임 크기
	const buildingSpriteHeight = $derived(animator ? (animator.getMetadata()?.frameHeight ?? 0) : 0);

	// 건물 중앙 바닥점 기준 캐릭터 위치 (퍼센트)
	// 건물 position은 중앙이므로, y + height/2가 바닥
	// resolution을 고려하여 실제 렌더링 크기 계산
	const buildingBottomY = $derived(y + (buildingSpriteHeight * 2) / 2); // resolution=2
	const characterX = $derived(x + characterOffset.x);
	const characterY = $derived(buildingBottomY + characterOffset.y);
	const characterLeft = $derived(`${(characterX / world.terrainBody.width) * 100}%`);
	const characterTop = $derived(`${(characterY / world.terrainBody.height) * 100}%`);

	// buildingState가 변경되면 animator 생성
	$effect(() => {
		const atlasName = buildingState.atlas_name;

		SpriteAnimator.create(atlasName).then((newAnimator) => {
			animator?.stop();
			newAnimator.init({
				name: buildingState.type,
				from: buildingState.frame_from ?? undefined,
				to: buildingState.frame_to ?? undefined,
				fps: buildingState.fps ?? undefined,
			});
			newAnimator.play({
				name: buildingState.type,
				loop: buildingState.loop ?? 'loop',
			});
			animator = newAnimator;
		});

		return () => {
			animator?.stop();
		};
	});
</script>

<div
	class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
	style="left: {left}; top: {top}; rotate: {rotation};"
>
	{#if animator}
		<SpriteAnimatorRenderer {animator} resolution={2} />
	{/if}
</div>

{#if characterBodyState}
	<div
		class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {characterLeft}; top: {characterTop};"
	>
		<CharacterSpriteAnimator bodyState={characterBodyState} faceState={characterFaceState} />
	</div>
{/if}
