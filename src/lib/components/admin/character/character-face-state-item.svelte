<script lang="ts">
	import type {
		CharacterFaceStateType,
		CharacterId,
		CharacterBodyId,
		CharacterFaceState,
	} from '$lib/types';
	import SpriteStateItem, {
		type SpriteStateChange,
	} from '$lib/components/admin/sprite-state-item.svelte';
	import { CharacterSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useCharacterBody } from '$lib/hooks/use-character-body';
	import { getCharacterFaceStateLabel } from '$lib/utils/state-label';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupInput,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { IconX } from '@tabler/icons-svelte';
	import { debounce } from 'radash';

	interface Props {
		characterId: string;
		type: CharacterFaceStateType;
	}

	let { characterId, type }: Props = $props();

	const { store, faceStateStore, admin } = useCharacter();
	const { bodyStateStore } = useCharacterBody();

	const character = $derived($store.data[characterId as CharacterId]);
	const faceStates = $derived($faceStateStore.data[characterId as CharacterId] ?? []);
	const faceState = $derived(faceStates.find((s: CharacterFaceState) => s.type === type));

	// 선택된 바디 상태 가져오기
	const uiStore = admin.uiStore;
	const previewBodyStateType = $derived($uiStore.previewBodyStateType);
	const bodyStates = $derived(
		character ? ($bodyStateStore.data[character.body_id as CharacterBodyId] ?? []) : []
	);
	const previewBodyState = $derived(bodyStates.find((s) => s.type === previewBodyStateType));

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
			await admin.updateCharacterFaceState(faceState.id, characterId as CharacterId, change);
		} else if (change.atlas_name) {
			await admin.createCharacterFaceState(characterId as CharacterId, {
				type,
				atlas_name: change.atlas_name,
			});
		}
	}

	async function ondelete() {
		if (faceState) {
			await admin.removeCharacterFaceState(faceState.id, characterId as CharacterId);
		}
	}

	async function updateOffset() {
		if (!faceState) return;
		const newOffsetX = parseInt(offsetX) || 0;
		const newOffsetY = parseInt(offsetY) || 0;
		if (newOffsetX === faceState.offset_x && newOffsetY === faceState.offset_y) return;
		await admin.updateCharacterFaceState(faceState.id, characterId as CharacterId, {
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
			<InputGroup class="max-w-44">
				<InputGroupAddon align="inline-start">
					<InputGroupText>오프셋</InputGroupText>
				</InputGroupAddon>
				<InputGroupInput
					type="number"
					bind:value={offsetX}
					oninput={debouncedUpdateOffset}
					placeholder="x"
				/>
				<InputGroupText>
					<IconX class="size-3" />
				</InputGroupText>
				<InputGroupInput
					type="number"
					bind:value={offsetY}
					oninput={debouncedUpdateOffset}
					placeholder="y"
				/>
			</InputGroup>
		{/if}
	{/snippet}
	{#snippet preview()}
		{#if previewBodyState}
			<CharacterSpriteAnimator bodyState={previewBodyState} {faceState} resolution={2} />
		{/if}
	{/snippet}
</SpriteStateItem>
