<script lang="ts">
	import type { WorldCharacterEntity } from './world-character-entity.svelte';
	import { CharacterSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useWorld } from '$lib/hooks/use-world';

	interface Props {
		entity: WorldCharacterEntity;
	}

	let { entity }: Props = $props();

	const { store: characterStore } = useCharacter();
	const { worldCharacterStore, selectedEntityIdStore } = useWorld();

	const worldCharacter = $derived($worldCharacterStore.data[entity.id]);
	const character = $derived(
		worldCharacter ? $characterStore.data[worldCharacter.character_id] : undefined
	);
	const selected = $derived($selectedEntityIdStore.entityId === entity.toEntityId());

	// 경로를 SVG path 문자열로 변환
	const pathString = $derived(
		entity.path.length === 0
			? ''
			: entity.path.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
	);
</script>

{#if character}
	<!-- 경로 시각화는 월드 레벨에서 렌더링 -->
	{#if entity.path.length > 0}
		<svg class="pointer-events-none absolute top-0 left-0" style="width: 100%; height: 100%;">
			<path d={pathString} stroke="white" stroke-width="1" fill="none" />
		</svg>
	{/if}

	<!-- 캐릭터 스프라이트 -->
	<div
		class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {entity.x}px; top: {entity.y}px;"
	>
		<CharacterSpriteAnimator
			characterId={character.id}
			bodyStateType="idle"
			faceStateType="idle"
			{selected}
		/>
	</div>
{/if}
