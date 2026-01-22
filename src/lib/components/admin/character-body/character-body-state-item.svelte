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
	import { useCharacter } from '$lib/hooks/use-character';
	import { getCharacterBodyStateLabel, getCharacterFaceStateLabel } from '$lib/utils/state-label';
	import { InputGroup, InputGroupAddon, InputGroupButton } from '$lib/components/ui/input-group';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuRadioGroup,
		DropdownMenuRadioItem,
	} from '$lib/components/ui/dropdown-menu';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { IconChevronDown } from '@tabler/icons-svelte';

	interface Props {
		bodyId: CharacterBodyId;
		type: CharacterBodyStateType;
	}

	let { bodyId, type }: Props = $props();

	const { characterBodyStore, characterBodyStateStore, admin } = useCharacter();
	const { characterUiStore } = admin;

	const body = $derived($characterBodyStore.data[bodyId]);
	const bodyStates = $derived($characterBodyStateStore.data[bodyId] ?? []);
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
				await admin.updateCharacterBody(bodyId, {
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
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<Tooltip>
						<TooltipTrigger>
							{#snippet child({ props })}
								<InputGroupButton
									{...props}
									variant={bodyState.in_front ? 'secondary' : 'ghost'}
									onclick={() => onInFrontChange(!bodyState.in_front)}
								>
									프론트 바디
								</InputGroupButton>
							{/snippet}
						</TooltipTrigger>
						<TooltipContent>활성화 시 바디가 얼굴 앞에 렌더링됩니다.</TooltipContent>
					</Tooltip>
				</InputGroupAddon>
				<InputGroupAddon align="inline-end">
					<DropdownMenu>
						<DropdownMenuTrigger>
							{#snippet child({ props })}
								<InputGroupButton {...props} variant="ghost">
									{bodyState.character_face_state
										? getCharacterFaceStateLabel(bodyState.character_face_state)
										: '시스템'}
									<IconChevronDown class="ml-1 size-3" />
								</InputGroupButton>
							{/snippet}
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							<DropdownMenuRadioGroup
								value={bodyState.character_face_state ?? ''}
								onValueChange={onFaceStateChange}
							>
								<DropdownMenuRadioItem value="">시스템</DropdownMenuRadioItem>
								{#each faceStateOptions as faceType (faceType)}
									<DropdownMenuRadioItem value={faceType}>
										{getCharacterFaceStateLabel(faceType)}
									</DropdownMenuRadioItem>
								{/each}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</InputGroupAddon>
			</InputGroup>
		{/if}
	{/snippet}
	{#snippet preview()}
		{#if animator}
			<SpriteAnimatorRenderer {animator} resolution={2} />
		{/if}
	{/snippet}
	{#snippet collider()}
		{#if $characterUiStore.showBodyPreview && body && (body.collider_width > 0 || body.collider_height > 0)}
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
