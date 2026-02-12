<script lang="ts">
	import { useCharacter } from '$lib/hooks';
	import type { CharacterFaceStateType, CharacterId, CharacterFaceState } from '$lib/types';
	import SpriteStateItem, {
		type SpriteStateChange,
	} from '$lib/components/admin/sprite-state-item.svelte';
	import { CharacterSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { getCharacterFaceStateString } from '$lib/utils/label';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		characterId: CharacterId;
		type: CharacterFaceStateType;
	}

	let { characterId, type }: Props = $props();

	const { characterStore, characterFaceStateStore, admin, openCharacterFaceStateDialog } =
		useCharacter();

	const character = $derived($characterStore.data[characterId]);
	const faceStates = $derived($characterFaceStateStore.data[characterId] ?? []);
	const faceState = $derived(faceStates.find((s: CharacterFaceState) => s.type === type));

	// 선택된 바디 상태 가져오기
	const uiStore = admin.characterUiStore;
	const previewBodyStateType = $derived($uiStore.previewBodyStateType);

	async function onchange(change: SpriteStateChange) {
		if (faceState) {
			await admin.updateCharacterFaceState(faceState.id, characterId, change);
		} else if (change.atlas_name) {
			await admin.createCharacterFaceState(characterId, {
				type,
				atlas_name: change.atlas_name,
			});
		}
	}

	async function ondelete() {
		if (faceState) {
			await admin.removeCharacterFaceState(faceState.id, characterId);
		}
	}

	function onOffsetClick() {
		if (faceState) {
			openCharacterFaceStateDialog({ type: 'update', characterFaceStateId: faceState.id });
		}
	}
</script>

<SpriteStateItem
	{type}
	label={getCharacterFaceStateString(type)}
	spriteState={faceState}
	{onchange}
	{ondelete}
>
	{#snippet action()}
		{#if faceState}
			<Button variant="outline" size="sm" onclick={onOffsetClick}>오프셋 수정</Button>
		{/if}
	{/snippet}
	{#snippet preview()}
		{#if character && previewBodyStateType}
			<CharacterSpriteAnimator
				characterId={character.id}
				bodyStateType={previewBodyStateType}
				faceStateType={type}
				resolution={2}
			/>
		{/if}
	{/snippet}
</SpriteStateItem>
