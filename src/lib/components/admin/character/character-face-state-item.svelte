<script lang="ts">
	import type { CharacterFaceStateType, CharacterId, CharacterFaceState } from '$lib/types';
	import SpriteStateItem, {
		type SpriteStateChange,
	} from '$lib/components/admin/sprite-state-item.svelte';
	import { CharacterSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { useCharacter } from '$lib/hooks/use-character';
	import { getCharacterFaceStateLabel } from '$lib/utils/state-label';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		characterId: CharacterId;
		type: CharacterFaceStateType;
	}

	let { characterId, type }: Props = $props();

	const { store, faceStateStore, admin, openFaceStateDialog } = useCharacter();

	const character = $derived($store.data[characterId]);
	const faceStates = $derived($faceStateStore.data[characterId] ?? []);
	const faceState = $derived(faceStates.find((s: CharacterFaceState) => s.type === type));

	// 선택된 바디 상태 가져오기
	const uiStore = admin.uiStore;
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
			openFaceStateDialog({ type: 'update', characterFaceStateId: faceState.id });
		}
	}
</script>

<SpriteStateItem
	{type}
	label={getCharacterFaceStateLabel(type)}
	spriteState={faceState}
	{onchange}
	{ondelete}
>
	{#snippet action()}
		{#if faceState}
			<Button variant="outline" size="sm" onclick={onOffsetClick}> 오프셋 수정 </Button>
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
