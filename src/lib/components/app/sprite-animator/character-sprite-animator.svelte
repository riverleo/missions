<script lang="ts">
	import type { CharacterBodyState, CharacterFaceState, ItemState, LoopMode } from '$lib/types';
	import { SpriteAnimator } from './sprite-animator.svelte';
	import SpriteAnimatorRenderer from './sprite-animator-renderer.svelte';

	interface Props {
		bodyState: CharacterBodyState;
		faceState?: CharacterFaceState;
		heldItemState?: ItemState;
		heldItemOffset?: { x: number; y: number };
		resolution?: 1 | 2 | 3;
		flip?: boolean;
	}

	let {
		bodyState,
		faceState,
		heldItemState,
		heldItemOffset,
		resolution = 2,
		flip = false,
	}: Props = $props();

	// Body가 앞에 렌더링되는지
	const isBodyInFront = $derived(bodyState.in_front);

	let bodyAnimator = $state<SpriteAnimator | undefined>(undefined);
	let faceAnimator = $state<SpriteAnimator | undefined>(undefined);
	let heldItemAnimator = $state<SpriteAnimator | undefined>(undefined);

	// Body animator 생성 및 재생
	$effect(() => {
		const atlasName = bodyState.atlas_name;

		SpriteAnimator.create(atlasName).then((newAnimator) => {
			bodyAnimator?.stop();
			newAnimator.init({
				name: bodyState.type,
				from: bodyState.frame_from ?? undefined,
				to: bodyState.frame_to ?? undefined,
				fps: bodyState.fps ?? undefined,
			});
			newAnimator.play({
				name: bodyState.type,
				loop: (bodyState.loop as LoopMode) ?? 'loop',
			});
			bodyAnimator = newAnimator;
		});

		return () => {
			bodyAnimator?.stop();
		};
	});

	// Face animator 생성 및 재생
	$effect(() => {
		const atlasName = faceState?.atlas_name;
		if (!atlasName) {
			faceAnimator?.stop();
			faceAnimator = undefined;
			return;
		}

		SpriteAnimator.create(atlasName).then((newAnimator) => {
			faceAnimator?.stop();
			newAnimator.init({
				name: faceState.type,
				from: faceState.frame_from ?? undefined,
				to: faceState.frame_to ?? undefined,
				fps: faceState.fps ?? undefined,
			});
			newAnimator.play({
				name: faceState.type,
				loop: (faceState.loop as LoopMode) ?? 'loop',
			});
			faceAnimator = newAnimator;
		});

		return () => {
			faceAnimator?.stop();
		};
	});

	// Held item animator 생성 및 재생
	$effect(() => {
		const atlasName = heldItemState?.atlas_name;
		if (!atlasName) {
			heldItemAnimator?.stop();
			heldItemAnimator = undefined;
			return;
		}

		SpriteAnimator.create(atlasName).then((newAnimator) => {
			heldItemAnimator?.stop();
			newAnimator.init({
				name: heldItemState.type,
				from: heldItemState.frame_from ?? undefined,
				to: heldItemState.frame_to ?? undefined,
				fps: heldItemState.fps ?? undefined,
			});
			newAnimator.play({
				name: heldItemState.type,
				loop: (heldItemState.loop as LoopMode) ?? 'loop',
			});
			heldItemAnimator = newAnimator;
		});

		return () => {
			heldItemAnimator?.stop();
		};
	});

	// 현재 프레임의 faceOffset 계산 (atlas 메타데이터 + DB offset)
	const faceOffset = $derived.by(() => {
		if (!bodyAnimator) return { x: 0, y: 0 };

		const metadata = bodyAnimator.getMetadata();
		const atlasOffset = metadata?.faceOffsets?.[bodyAnimator.currentFrame];

		// Atlas에서 추출한 offset + DB에서 세밀 조정한 offset
		const x = (atlasOffset?.x ?? 0) + (faceState?.offset_x ?? 0);
		const y = (atlasOffset?.y ?? 0) + (faceState?.offset_y ?? 0);

		return { x, y };
	});

	// Transform 스타일 계산
	const faceTransform = $derived(
		`translate(${faceOffset.x / resolution}px, ${faceOffset.y / resolution}px)`
	);

	// 현재 프레임의 handOffset 계산 (atlas 메타데이터 + DB offset)
	const handOffset = $derived.by(() => {
		if (!bodyAnimator) return { x: 0, y: 0 };

		const metadata = bodyAnimator.getMetadata();
		const atlasOffset = metadata?.handOffsets?.[bodyAnimator.currentFrame];

		// Atlas에서 추출한 offset + DB에서 세밀 조정한 offset
		const x = (atlasOffset?.x ?? 0) + (heldItemOffset?.x ?? 0);
		const y = (atlasOffset?.y ?? 0) + (heldItemOffset?.y ?? 0);

		return { x, y };
	});

	// Transform 스타일 계산
	const handTransform = $derived(
		`translate(${handOffset.x / resolution}px, ${handOffset.y / resolution}px)`
	);
</script>

<div
	class="relative inline-flex items-center justify-center"
	style:transform={flip ? 'scaleX(-1)' : undefined}
>
	{#if isBodyInFront}
		{#if faceAnimator}
			<div class="absolute" style:transform={faceTransform}>
				<SpriteAnimatorRenderer animator={faceAnimator} {resolution} />
			</div>
		{/if}
		{#if bodyAnimator}
			<SpriteAnimatorRenderer animator={bodyAnimator} {resolution} />
		{/if}
	{:else}
		{#if bodyAnimator}
			<SpriteAnimatorRenderer animator={bodyAnimator} {resolution} />
		{/if}
		{#if faceAnimator}
			<div class="absolute" style:transform={faceTransform}>
				<SpriteAnimatorRenderer animator={faceAnimator} {resolution} />
			</div>
		{/if}
	{/if}
	{#if heldItemAnimator}
		<div class="absolute" style:transform={handTransform}>
			<SpriteAnimatorRenderer animator={heldItemAnimator} {resolution} />
		</div>
	{/if}
</div>
