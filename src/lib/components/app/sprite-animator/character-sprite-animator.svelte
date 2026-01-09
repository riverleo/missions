<script lang="ts">
	import type {
		CharacterId,
		CharacterBodyStateType,
		CharacterFaceStateType,
		ItemState,
		LoopMode,
	} from '$lib/types';
	import type { HTMLAttributes } from 'svelte/elements';
	import { SpriteAnimator } from './sprite-animator.svelte';
	import SpriteAnimatorRenderer from './sprite-animator-renderer.svelte';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useCharacterBody } from '$lib/hooks/use-character-body';
	import { cn } from '$lib/utils';

	const OUTLINE_WIDTH = 10;

	interface Props extends HTMLAttributes<HTMLDivElement> {
		characterId: CharacterId;
		bodyStateType: CharacterBodyStateType;
		faceStateType?: CharacterFaceStateType;
		heldItemState?: ItemState;
		heldItemOffset?: { x: number; y: number };
		heldItemScale?: number;
		heldItemRotation?: number;
		resolution?: 1 | 2 | 3;
		flip?: boolean;
		selected?: boolean;
	}

	let {
		characterId,
		bodyStateType,
		faceStateType,
		heldItemState,
		heldItemOffset,
		heldItemScale = 1,
		heldItemRotation = 0,
		resolution = 2,
		flip = false,
		selected = false,
		class: className,
		...restProps
	}: Props = $props();

	const { store, faceStateStore } = useCharacter();
	const { store: characterBodyStore, bodyStateStore } = useCharacterBody();

	const character = $derived($store.data[characterId]);
	const scale = $derived(character?.scale ?? 1);

	const characterBody = $derived(
		character ? $characterBodyStore.data[character.character_body_id] : undefined
	);
	const bodyStates = $derived(characterBody ? ($bodyStateStore.data[characterBody.id] ?? []) : []);
	const bodyState = $derived(bodyStates.find((s) => s.type === bodyStateType));

	const faceStates = $derived($faceStateStore.data[characterId] ?? []);
	const faceState = $derived(
		faceStateType ? faceStates.find((s) => s.type === faceStateType) : undefined
	);

	// Body가 앞에 렌더링되는지
	const isBodyInFront = $derived(bodyState?.in_front ?? false);

	let bodyAnimator = $state<SpriteAnimator | undefined>(undefined);
	let faceAnimator = $state<SpriteAnimator | undefined>(undefined);
	let heldItemAnimator = $state<SpriteAnimator | undefined>(undefined);

	// Body animator 생성 및 재생
	$effect(() => {
		if (!bodyState) {
			bodyAnimator?.stop();
			bodyAnimator = undefined;
			return;
		}

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

	// Transform 스타일 계산 (translate, scale, rotate 순서)
	const handTransform = $derived(
		`translate(${handOffset.x / resolution}px, ${handOffset.y / resolution}px) scale(${heldItemScale}) rotate(${heldItemRotation}deg)`
	);
</script>

<div
	{...restProps}
	class={cn('relative flex items-center justify-center', className)}
	style:transform={flip ? `scale(${-scale}, ${scale})` : `scale(${scale})`}
>
	<!-- 선택 시 외곽선 레이어 -->
	{#if selected && bodyAnimator}
		<div
			class="absolute -z-10"
			style:transform="scale({1 + OUTLINE_WIDTH / 100})"
			style:filter="brightness(0) invert(1)"
		>
			{#if isBodyInFront}
				{#if faceAnimator}
					<div class="absolute top-0 left-0" style:transform={faceTransform}>
						<SpriteAnimatorRenderer animator={faceAnimator} {resolution} />
					</div>
				{/if}
				<SpriteAnimatorRenderer animator={bodyAnimator} {resolution} />
			{:else}
				<SpriteAnimatorRenderer animator={bodyAnimator} {resolution} />
				{#if faceAnimator}
					<div class="absolute top-0 left-0" style:transform={faceTransform}>
						<SpriteAnimatorRenderer animator={faceAnimator} {resolution} />
					</div>
				{/if}
			{/if}
			{#if heldItemAnimator}
				<div class="absolute top-0 left-0" style:transform={handTransform}>
					<SpriteAnimatorRenderer animator={heldItemAnimator} {resolution} />
				</div>
			{/if}
		</div>
	{/if}

	<!-- 실제 캐릭터 -->
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
