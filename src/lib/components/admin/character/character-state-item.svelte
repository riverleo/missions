<script lang="ts">
	import type { CharacterFaceStateType } from '$lib/types';
	import SpriteStateItem, {
		type SpriteStateChange,
	} from '$lib/components/admin/sprite-state-item.svelte';
	import { CharacterSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { useCharacter } from '$lib/hooks/use-character';
	import { getCharacterFaceStateLabel } from '$lib/utils/state-label';

	interface Props {
		characterId: string;
		type: CharacterFaceStateType;
	}

	let { characterId, type }: Props = $props();

	const { store, admin } = useCharacter();

	const character = $derived($store.data[characterId]);
	const faceState = $derived(character?.character_face_states.find((s) => s.type === type));

	// 몸통의 idle 상태 가져오기
	const bodyIdleState = $derived(
		character?.character_body?.character_body_states.find((s) => s.type === 'idle')
	);

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
</script>

<SpriteStateItem {type} label={getCharacterFaceStateLabel(type)} spriteState={faceState} {onchange} {ondelete}>
	{#snippet preview()}
		{#if bodyIdleState}
			<CharacterSpriteAnimator bodyState={bodyIdleState} {faceState} resolution={2} />
		{/if}
	{/snippet}
</SpriteStateItem>
