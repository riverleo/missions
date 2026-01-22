<script lang="ts">
	import type {
		BuildingId,
		BuildingStateType,
		CharacterId,
		CharacterBodyStateType,
		CharacterFaceStateType,
		LoopMode,
	} from '$lib/types';
	import type { HTMLAttributes } from 'svelte/elements';
	import { SpriteAnimator } from './sprite-animator.svelte';
	import SpriteAnimatorRenderer from './sprite-animator-renderer.svelte';
	import CharacterSpriteAnimator from './character-sprite-animator.svelte';
	import { useBuilding } from '$lib/hooks/use-building';
	import { cn } from '$lib/utils';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		buildingId: BuildingId;
		stateType: BuildingStateType;
		characterId?: CharacterId;
		characterBodyStateType?: CharacterBodyStateType;
		characterFaceStateType?: CharacterFaceStateType;
		characterOffset?: { x: number; y: number };
		characterScale?: number;
		characterRotation?: number;
		scale?: number;
		resolution?: 1 | 2 | 3;
		selected?: boolean;
	}

	let {
		buildingId,
		stateType,
		characterId,
		characterBodyStateType,
		characterFaceStateType,
		characterOffset = { x: 0, y: 0 },
		characterScale = 1,
		characterRotation = 0,
		scale = 1,
		resolution = 2,
		selected = false,
		class: className,
		...restProps
	}: Props = $props();

	const { buildingStateStore: stateStore } = useBuilding();
	const buildingStates = $derived($stateStore.data[buildingId] ?? []);
	const buildingState = $derived(buildingStates.find((s) => s.type === stateType));

	const OUTLINE_WIDTH = 8;

	let animator = $state<SpriteAnimator | undefined>(undefined);

	$effect(() => {
		if (!buildingState) return;

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

<div
	{...restProps}
	class={cn('relative flex items-center justify-center', className)}
	style:transform={`scale(${scale})`}
>
	<!-- 선택 시 외곽선 -->
	{#if selected && animator}
		<div
			class="absolute -z-10"
			style:transform="scale({1 + OUTLINE_WIDTH / 100})"
			style:filter="brightness(0) invert(1)"
		>
			<SpriteAnimatorRenderer {animator} {resolution} />
		</div>
	{/if}

	{#if animator}
		<SpriteAnimatorRenderer {animator} {resolution} />
	{/if}
	{#if characterId && characterBodyStateType}
		<div
			class="absolute bottom-0 left-1/2"
			style:transform="translate(calc(-50% + {characterOffset.x / resolution}px), {-characterOffset.y /
				resolution}px) scale({characterScale}) rotate({characterRotation}deg)"
		>
			<CharacterSpriteAnimator
				{characterId}
				bodyStateType={characterBodyStateType}
				faceStateType={characterFaceStateType}
				{resolution}
				flip={characterOffset.x < 0}
			/>
		</div>
	{/if}
</div>
