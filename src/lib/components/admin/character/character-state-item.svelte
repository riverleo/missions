<script lang="ts">
	import type { CharacterStateType } from '$lib/types';
	import SpriteStateItem, {
		type SpriteStateChange,
	} from '$lib/components/admin/sprite-state-item.svelte';
	import { atlases } from '$lib/components/app/sprite-animator';
	import { DEBUG_CHARACTER_FILL_STYLE } from '$lib/components/app/world/constants';
	import { useCharacter } from '$lib/hooks/use-character';

	interface Props {
		characterId: string;
		type: CharacterStateType;
	}

	let { characterId, type }: Props = $props();

	const { store, admin } = useCharacter();
	const { uiStore } = admin;

	const character = $derived($store.data[characterId]);
	const characterState = $derived(character?.character_states.find((s) => s.type === type));

	async function onchange(change: SpriteStateChange) {
		if (characterState) {
			await admin.updateCharacterState(characterState.id, characterId, change);
		} else if (change.atlas_name) {
			await admin.createCharacterState(characterId, { type, atlas_name: change.atlas_name });
		}

		// 캐릭터의 width/height가 0이면 atlas frame 크기로 설정
		if (change.atlas_name && character && character.width === 0 && character.height === 0) {
			const metadata = atlases[change.atlas_name];
			if (metadata) {
				await admin.update(characterId, {
					width: metadata.frameWidth / 2,
					height: metadata.frameHeight / 2,
				});
			}
		}
	}

	async function ondelete() {
		if (characterState) {
			await admin.removeCharacterState(characterState.id, characterId);
		}
	}
</script>

<SpriteStateItem {type} spriteState={characterState} {onchange} {ondelete}>
	{#snippet bodyPreview()}
		{#if $uiStore.showBodyPreview && character && (character.width > 0 || character.height > 0)}
			<svg class="pointer-events-none absolute inset-0 h-full w-full">
				<ellipse
					cx="50%"
					cy="50%"
					rx={character.width / 2}
					ry={character.height / 2}
					fill={DEBUG_CHARACTER_FILL_STYLE}
				/>
			</svg>
		{/if}
	{/snippet}
</SpriteStateItem>
