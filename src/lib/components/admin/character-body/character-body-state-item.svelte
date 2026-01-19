<script lang="ts">
	import type {
		CharacterBodyStateType,
		CharacterFaceStateType,
		CharacterBodyId,
		CharacterBodyState,
		LoopMode,
	} from '$lib/types';
	import SpriteStateItem, {
		type SpriteStateChange,
	} from '$lib/components/admin/sprite-state-item.svelte';
	import { SpriteAnimator } from '$lib/components/app/sprite-animator/sprite-animator.svelte';
	import SpriteAnimatorRenderer from '$lib/components/app/sprite-animator/sprite-animator-renderer.svelte';
	import { atlases } from '$lib/components/app/sprite-animator';
	import { useCharacterBody } from '$lib/hooks/use-character-body';
	import { useCharacter } from '$lib/hooks/use-character';
	import { getCharacterBodyStateLabel, getCharacterFaceStateLabel } from '$lib/utils/state-label';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Toggle } from '$lib/components/ui/toggle';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { Button } from '$lib/components/ui/button';
	import { IconInfoCircle, IconLayersSubtract, IconQuestionMark } from '@tabler/icons-svelte';

	interface Props {
		bodyId: CharacterBodyId;
		type: CharacterBodyStateType;
	}

	let { bodyId, type }: Props = $props();

	const { store, bodyStateStore, admin } = useCharacterBody();
	const { uiStore } = admin;

	const body = $derived($store.data[bodyId]);
	const bodyStates = $derived($bodyStateStore.data[bodyId] ?? []);
	const bodyState = $derived(bodyStates.find((s: CharacterBodyState) => s.type === type));

	const faceStateOptions: CharacterFaceStateType[] = ['idle', 'happy', 'sad', 'angry'];

	let animator = $state<SpriteAnimator | undefined>(undefined);

	$effect(() => {
		const atlasName = bodyState?.atlas_name;
		if (!atlasName) return;

		SpriteAnimator.create(atlasName).then((newAnimator) => {
			animator?.stop();
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
			animator = newAnimator;
		});

		return () => {
			animator?.stop();
		};
	});

	async function onchange(change: SpriteStateChange) {
		if (bodyState) {
			await admin.updateCharacterBodyState(bodyState.id, bodyId, change);
		} else if (change.atlas_name) {
			await admin.createCharacterBodyState(bodyId, {
				type,
				atlas_name: change.atlas_name,
			});
		}

		// body의 width/height가 0이면 atlas frame 크기로 설정
		if (change.atlas_name && body && body.collider_width === 0 && body.collider_height === 0) {
			const metadata = atlases[change.atlas_name];
			if (metadata) {
				await admin.update(bodyId, {
					collider_width: metadata.frameWidth / 2,
					collider_height: metadata.frameHeight / 2,
				});
			}
		}
	}

	async function ondelete() {
		if (bodyState) {
			await admin.removeCharacterBodyState(bodyState.id, bodyId);
		}
	}

	async function onInFrontChange(pressed: boolean) {
		if (bodyState) {
			await admin.updateCharacterBodyState(bodyState.id, bodyId, {
				in_front: pressed,
			});
		}
	}

	async function onFaceStateChange(value: string) {
		if (bodyState) {
			const faceState = value === '' ? null : (value as CharacterFaceStateType);
			await admin.updateCharacterBodyState(bodyState.id, bodyId, {
				character_face_state: faceState,
			});
		}
	}
</script>

<SpriteStateItem
	{type}
	label={getCharacterBodyStateLabel(type)}
	spriteState={bodyState}
	{onchange}
	{ondelete}
>
	{#snippet action()}
		{#if bodyState}
			<ButtonGroup>
				<ButtonGroup>
					<Tooltip>
						<TooltipTrigger>
							{#snippet child({ props })}
								<Toggle
									variant="outline"
									{...props}
									pressed={bodyState.in_front}
									onPressedChange={onInFrontChange}
								>
									맨 앞으로
								</Toggle>
							{/snippet}
						</TooltipTrigger>
						<TooltipContent>활성화 시 바디가 얼굴 앞에 렌더링됩니다.</TooltipContent>
					</Tooltip>
					<Select
						type="single"
						value={bodyState.character_face_state ?? ''}
						onValueChange={onFaceStateChange}
					>
						<SelectTrigger>
							{bodyState.character_face_state
								? getCharacterFaceStateLabel(bodyState.character_face_state)
								: '시스템'}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">시스템</SelectItem>
							{#each faceStateOptions as faceType (faceType)}
								<SelectItem value={faceType}>{getCharacterFaceStateLabel(faceType)}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</ButtonGroup>
			</ButtonGroup>
		{/if}
	{/snippet}
	{#snippet preview()}
		{#if animator}
			<SpriteAnimatorRenderer {animator} resolution={2} />
		{/if}
	{/snippet}
	{#snippet collider()}
		{#if $uiStore.showBodyPreview && body && (body.collider_width > 0 || body.collider_height > 0)}
			<svg
				width={body.collider_width}
				height={body.collider_height}
				style="transform: translate({-body.collider_offset_x}px, {-body.collider_offset_y}px);"
			>
				{#if body.collider_type === 'circle'}
					<circle
						cx={body.collider_width / 2}
						cy={body.collider_height / 2}
						r={body.collider_width / 2}
						fill="rgba(0, 255, 0, 0.5)"
					/>
				{:else}
					<rect
						width={body.collider_width}
						height={body.collider_height}
						fill="rgba(0, 255, 0, 0.5)"
					/>
				{/if}
			</svg>
		{/if}
	{/snippet}
</SpriteStateItem>
