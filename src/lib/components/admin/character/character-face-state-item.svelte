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
	import { useNeed } from '$lib/hooks/use-need';
	import { getCharacterFaceStateLabel } from '$lib/utils/state-label';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		characterId: string;
		type: CharacterFaceStateType;
	}

	let { characterId, type }: Props = $props();

	const { store, faceStateStore, admin, openFaceStateDialog } = useCharacter();
	const { needStore } = useNeed();

	const character = $derived($store.data[characterId as CharacterId]);
	const faceStates = $derived($faceStateStore.data[characterId as CharacterId] ?? []);
	const faceState = $derived(faceStates.find((s: CharacterFaceState) => s.type === type));
	const need = $derived(faceState?.need_id ? $needStore.data[faceState.need_id] : undefined);

	// 선택된 바디 상태 가져오기
	const uiStore = admin.uiStore;
	const previewBodyStateType = $derived($uiStore.previewBodyStateType);

	const needPreview = $derived.by(() => {
		if (type === 'idle') return undefined;

		if (!need) {
			return '욕구 선택 필요';
		}

		return `${need.name} (${faceState.min_value}~${faceState.max_value})`;
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

	function onNeedClick() {
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
		{#if needPreview !== undefined}
			<Button
				variant={need ? 'ghost' : 'outline'}
				size="sm"
				disabled={!faceState || type === 'idle'}
				onclick={onNeedClick}
			>
				{#if need}
					<Badge variant="secondary">{faceState?.priority}</Badge>
				{/if}
				{needPreview}
			</Button>
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
