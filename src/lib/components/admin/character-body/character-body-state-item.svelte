<script lang="ts">
	import type { CharacterBodyStateType, CharacterFaceStateType } from '$lib/types';
	import SpriteStateItem, {
		type SpriteStateChange,
	} from '$lib/components/admin/sprite-state-item.svelte';
	import { atlases } from '$lib/components/app/sprite-animator';
	import { DEBUG_CHARACTER_FILL_STYLE } from '$lib/components/app/world/constants';
	import { useCharacterBody } from '$lib/hooks/use-character-body';
	import { getCharacterBodyStateLabel, getCharacterFaceStateLabel } from '$lib/utils/state-label';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Toggle } from '$lib/components/ui/toggle';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { Button } from '$lib/components/ui/button';
	import { IconInfoCircle, IconLayersSubtract, IconQuestionMark } from '@tabler/icons-svelte';

	interface Props {
		bodyId: string;
		type: CharacterBodyStateType;
	}

	let { bodyId, type }: Props = $props();

	const { store, admin } = useCharacterBody();
	const { uiStore } = admin;

	const body = $derived($store.data[bodyId]);
	const bodyState = $derived(body?.character_body_states.find((s) => s.type === type));

	const faceStateOptions: CharacterFaceStateType[] = ['neutral', 'happy', 'sad', 'angry'];

	async function onchange(change: SpriteStateChange) {
		if (bodyState) {
			await admin.updateCharacterBodyState(bodyState.id, bodyId, change);
		} else if (change.atlas_name) {
			await admin.createCharacterBodyState(bodyId, { type, atlas_name: change.atlas_name });
		}

		// body의 width/height가 0이면 atlas frame 크기로 설정
		if (change.atlas_name && body && body.width === 0 && body.height === 0) {
			const metadata = atlases[change.atlas_name];
			if (metadata) {
				await admin.update(bodyId, {
					width: metadata.frameWidth / 2,
					height: metadata.frameHeight / 2,
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
			await admin.updateCharacterBodyState(bodyState.id, bodyId, { in_front: pressed });
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
	{#snippet headerAction()}
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
									<IconLayersSubtract />
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
				<ButtonGroup>
					<Tooltip>
						<TooltipTrigger>
							{#snippet child({ props })}
								<Button {...props} variant="ghost">
									<IconInfoCircle />
								</Button>
							{/snippet}
						</TooltipTrigger>
						<TooltipContent>
							현재 바디 상태에서 나타나는 얼굴 상태를 강제합니다.
							<br />
							'시스템'은 게임 컨텍스트에 따른 캐릭터 감정 상태를 따릅니다.
						</TooltipContent>
					</Tooltip>
				</ButtonGroup>
			</ButtonGroup>
		{/if}
	{/snippet}
	{#snippet overlay()}
		{#if $uiStore.showBodyPreview && body && (body.width > 0 || body.height > 0)}
			<svg class="pointer-events-none absolute inset-0 h-full w-full">
				<ellipse
					cx="50%"
					cy="50%"
					rx={body.width / 2}
					ry={body.height / 2}
					fill={DEBUG_CHARACTER_FILL_STYLE}
				/>
			</svg>
		{/if}
	{/snippet}
</SpriteStateItem>
