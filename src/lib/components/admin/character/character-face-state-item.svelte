<script lang="ts">
	import type { CharacterFaceStateType } from '$lib/types';
	import SpriteStateItem, {
		type SpriteStateChange,
	} from '$lib/components/admin/sprite-state-item.svelte';
	import { CharacterSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { useCharacter } from '$lib/hooks/use-character';
	import { getCharacterFaceStateLabel } from '$lib/utils/state-label';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupButton,
		InputGroupInput,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { IconAxisX, IconAxisY } from '@tabler/icons-svelte';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { debounce } from 'radash';

	interface Props {
		characterId: string;
		type: CharacterFaceStateType;
	}

	let { characterId, type }: Props = $props();

	const { store, admin } = useCharacter();

	const character = $derived($store.data[characterId]);
	const faceState = $derived(character?.character_face_states.find((s) => s.type === type));

	// 바디의 idle 상태 가져오기
	const bodyIdleState = $derived(
		character?.character_body?.character_body_states.find((s) => s.type === 'idle')
	);

	let offsetX = $state('');
	let offsetY = $state('');

	// faceState 변경 시 offset 값 동기화
	$effect(() => {
		offsetX = faceState?.offset_x?.toString() ?? '0';
	});
	$effect(() => {
		offsetY = faceState?.offset_y?.toString() ?? '0';
	});

	async function onchange(change: SpriteStateChange) {
		if (faceState) {
			await admin.updateCharacterFaceState(faceState.id, characterId, change);
		} else if (change.atlas_name) {
			await admin.createCharacterFaceState(characterId, { type, atlas_name: change.atlas_name });
		}
	}

	async function ondelete() {
		if (faceState) {
			await admin.removeCharacterFaceState(faceState.id, characterId);
		}
	}

	async function updateOffset() {
		if (!faceState) return;
		const newOffsetX = parseInt(offsetX) || 0;
		const newOffsetY = parseInt(offsetY) || 0;
		if (newOffsetX === faceState.offset_x && newOffsetY === faceState.offset_y) return;
		await admin.updateCharacterFaceState(faceState.id, characterId, {
			offset_x: newOffsetX,
			offset_y: newOffsetY,
		});
	}

	const debouncedUpdateOffset = debounce({ delay: 300 }, updateOffset);
</script>

<SpriteStateItem
	{type}
	label={getCharacterFaceStateLabel(type)}
	spriteState={faceState}
	{onchange}
	{ondelete}
>
	{#snippet headerAction()}
		{#if faceState}
			<ButtonGroup class="max-w-40">
				<ButtonGroup>
					<InputGroup>
						<InputGroupAddon>
							<Tooltip>
								<TooltipTrigger>
									{#snippet child({ props })}
										<InputGroupButton {...props} variant="ghost" size="icon-sm">
											<IconAxisX />
										</InputGroupButton>
									{/snippet}
								</TooltipTrigger>
								<TooltipContent>X축 미세 조정</TooltipContent>
							</Tooltip>
						</InputGroupAddon>
						<InputGroupInput
							type="number"
							bind:value={offsetX}
							oninput={debouncedUpdateOffset}
							placeholder="X"
						/>
					</InputGroup>
				</ButtonGroup>
				<ButtonGroup>
					<InputGroup class="max-w-44">
						<InputGroupAddon>
							<Tooltip>
								<TooltipTrigger>
									{#snippet child({ props })}
										<InputGroupButton {...props} variant="ghost" size="icon-sm">
											<IconAxisY />
										</InputGroupButton>
									{/snippet}
								</TooltipTrigger>
								<TooltipContent>Y축 미세 조정</TooltipContent>
							</Tooltip>
						</InputGroupAddon>
						<InputGroupInput
							type="number"
							bind:value={offsetY}
							oninput={debouncedUpdateOffset}
							placeholder="Y"
						/>
					</InputGroup>
				</ButtonGroup>
			</ButtonGroup>
		{/if}
	{/snippet}
	{#snippet preview()}
		{#if bodyIdleState}
			<CharacterSpriteAnimator bodyState={bodyIdleState} {faceState} resolution={2} />
		{/if}
	{/snippet}
</SpriteStateItem>
