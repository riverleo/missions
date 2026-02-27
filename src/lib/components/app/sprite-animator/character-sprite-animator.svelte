<script lang="ts">
	import { useCharacter } from '$lib/hooks';
	import type {
		CharacterId,
		CharacterBodyStateType,
		CharacterFaceStateType,
		ItemState,
		LoopType,
	} from '$lib/types';
	import type { HTMLAttributes } from 'svelte/elements';
	import { SpriteAnimator } from './sprite-animator.svelte';
	import SpriteAnimatorRenderer from './sprite-animator-renderer.svelte';
	import Self from './character-sprite-animator.svelte';
	import { cn } from '$lib/utils';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		characterId: CharacterId;
		bodyStateType: CharacterBodyStateType;
		faceStateType?: CharacterFaceStateType;
		heldItemState?: ItemState;
		heldItemOffset?: { x: number; y: number };
		heldItemScale?: number;
		heldItemRotation?: number;
		interactCharacterId?: CharacterId;
		interactCharacterBodyStateType?: CharacterBodyStateType;
		interactCharacterFaceStateType?: CharacterFaceStateType;
		interactCharacterOffset?: { x: number; y: number };
		interactCharacterScale?: number;
		interactCharacterRotation?: number;
		resolution?: 1 | 2 | 3;
		flip?: boolean;
	}

	let {
		characterId,
		bodyStateType,
		faceStateType,
		heldItemState,
		heldItemOffset,
		heldItemScale = 1,
		heldItemRotation = 0,
		interactCharacterId,
		interactCharacterBodyStateType,
		interactCharacterFaceStateType,
		interactCharacterOffset = { x: 0, y: 0 },
		interactCharacterScale = 1,
		interactCharacterRotation = 0,
		resolution = 2,
		flip = false,
		class: className,
		...restProps
	}: Props = $props();

	const { characterStore, characterFaceStateStore, characterBodyStore, characterBodyStateStore } =
		useCharacter();

	const character = $derived($characterStore.data[characterId]);
	const faceScale = $derived(character?.face_scale ?? 1);

	const characterBody = $derived(
		character ? $characterBodyStore.data[character.character_body_id] : undefined
	);
	const bodyStates = $derived(
		characterBody ? ($characterBodyStateStore.data[characterBody.id] ?? []) : []
	);
	const bodyScale = $derived(characterBody?.scale ?? 1);
	const bodyState = $derived(bodyStates.find((s) => s.type === bodyStateType));

	const faceStates = $derived($characterFaceStateStore.data[characterId] ?? []);
	const faceState = $derived(
		faceStateType ? faceStates.find((s) => s.type === faceStateType) : undefined
	);

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
				loop: (bodyState.loop as LoopType) ?? 'loop',
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
				loop: (faceState.loop as LoopType) ?? 'loop',
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
				loop: (heldItemState.loop as LoopType) ?? 'loop',
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

	// Transform 스타일 계산 (위치 + 페이스 스케일)
	// faceOffset은 atlas 원본 픽셀 좌표이므로 bodyScale을 곱하여 바디 크기에 맞게 보정
	const faceTransform = $derived(
		`translate(${(faceOffset.x * bodyScale) / resolution}px, ${(faceOffset.y * bodyScale) / resolution}px) scale(${faceScale})`
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
	// handOffset은 atlas 원본 픽셀 좌표이므로 bodyScale을 곱하여 바디 크기에 맞게 보정
	const handTransform = $derived(
		`translate(${(handOffset.x * bodyScale) / resolution}px, ${(handOffset.y * bodyScale) / resolution}px) scale(${heldItemScale}) rotate(${heldItemRotation}deg)`
	);
</script>

<div
	{...restProps}
	class={cn('relative flex items-center justify-center', className)}
	style:transform={flip ? 'scaleX(-1)' : undefined}
>
	<!-- 실제 캐릭터: 항상 바디 → 페이스 순서 -->
	{#if bodyAnimator}
		<div style:transform="scale({bodyScale})">
			<SpriteAnimatorRenderer animator={bodyAnimator} {resolution} />
		</div>
	{/if}
	{#if faceAnimator}
		<div class="absolute" style:transform={faceTransform}>
			<SpriteAnimatorRenderer animator={faceAnimator} {resolution} />
		</div>
	{/if}
	{#if heldItemAnimator}
		<div class="absolute" style:transform={handTransform}>
			<SpriteAnimatorRenderer animator={heldItemAnimator} {resolution} />
		</div>
	{/if}
	{#if interactCharacterId && interactCharacterBodyStateType}
		<div
			class="absolute bottom-0 left-1/2"
			style:transform="translate(calc(-50% + {interactCharacterOffset.x / resolution}px), {-interactCharacterOffset.y /
				resolution}px) scale({interactCharacterScale}) rotate({interactCharacterRotation}deg)"
		>
			<Self
				characterId={interactCharacterId}
				bodyStateType={interactCharacterBodyStateType}
				faceStateType={interactCharacterFaceStateType}
				{resolution}
				flip={interactCharacterOffset.x < 0}
			/>
		</div>
	{/if}
</div>
