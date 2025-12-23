<script lang="ts">
	import type { BuildingState, CharacterBodyState, CharacterFaceState, LoopMode } from '$lib/types';
	import { SpriteAnimator } from './sprite-animator.svelte';
	import SpriteAnimatorRenderer from './sprite-animator-renderer.svelte';
	import CharacterSpriteAnimator from './character-sprite-animator.svelte';

	interface Props {
		buildingState: BuildingState;
		characterBodyState?: CharacterBodyState;
		characterFaceState?: CharacterFaceState;
		characterOffset?: { x: number; y: number };
		resolution?: 1 | 2 | 3;
	}

	let {
		buildingState,
		characterBodyState,
		characterFaceState,
		characterOffset = { x: 0, y: 0 },
		resolution = 2,
	}: Props = $props();

	let animator = $state<SpriteAnimator | undefined>(undefined);

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
				loop: (buildingState.loop as LoopMode) ?? 'loop',
			});
			animator = newAnimator;
		});

		return () => {
			animator?.stop();
		};
	});
</script>

<div class="relative inline-flex items-center justify-center">
	{#if animator}
		<SpriteAnimatorRenderer {animator} {resolution} />
	{/if}
	{#if characterBodyState}
		<div
			class="absolute bottom-0 left-1/2"
			style:transform="translate(calc(-50% + {characterOffset.x / resolution}px), {-characterOffset.y /
				resolution}px)"
		>
			<CharacterSpriteAnimator
				bodyState={characterBodyState}
				faceState={characterFaceState}
				{resolution}
				flip={characterOffset.x < 0}
			/>
		</div>
	{/if}
</div>
