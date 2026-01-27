<script lang="ts">
	import type { WorldCharacterEntity } from './world-character-entity.svelte';
	import { CharacterSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useWorld } from '$lib/hooks/use-world';
	import { useItem } from '$lib/hooks/use-item';

	interface Props {
		entity: WorldCharacterEntity;
	}

	let { entity }: Props = $props();

	const { characterStore, characterBodyStore } = useCharacter();
	const { worldCharacterStore, worldItemStore, selectedEntityIdStore } = useWorld();
	const { itemStore, itemStateStore } = useItem();

	const worldCharacter = $derived($worldCharacterStore.data[entity.instanceId]);
	const character = $derived(
		worldCharacter ? $characterStore.data[worldCharacter.character_id] : undefined
	);
	const characterBody = $derived(
		character ? $characterBodyStore.data[character.character_body_id] : undefined
	);
	const selected = $derived($selectedEntityIdStore.entityId === entity.id);

	// 캐릭터가 들고 있는 마지막 아이템의 상태 가져오기
	const heldItemState = $derived.by(() => {
		if (entity.heldWorldItemIds.length === 0) return undefined;

		const lastHeldItemId = entity.heldWorldItemIds[entity.heldWorldItemIds.length - 1];
		if (!lastHeldItemId) return undefined;

		const worldItem = $worldItemStore.data[lastHeldItemId];
		if (!worldItem) return undefined;

		const item = $itemStore.data[worldItem.item_id];
		if (!item) return undefined;

		const itemStates = $itemStateStore.data[item.id] ?? [];
		const itemState = itemStates.find((s) => s.type === 'idle');

		return itemState;
	});

	// 경로를 SVG path 문자열로 변환 (현재 위치에서 시작)
	const pathString = $derived.by(() => {
		if (entity.path.length === 0) return '';

		// 현재 캐릭터 위치에서 시작
		const points = [{ x: entity.x, y: entity.y }, ...entity.path];
		return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
	});

	// 디버그 모드일 때 opacity 낮춤
	const opacity = $derived(entity.debug ? 0.6 : 1);
</script>

{#if character}
	<!-- 경로 시각화는 월드 레벨에서 렌더링 -->
	{#if entity.path.length > 0}
		<svg class="absolute top-0 left-0 opacity-30" style="width: 100%; height: 100%;">
			<path d={pathString} stroke="white" stroke-width="1" fill="none" />
		</svg>
	{/if}

	<!-- 캐릭터 스프라이트 -->
	<CharacterSpriteAnimator
		characterId={character.id}
		bodyStateType="idle"
		faceStateType="idle"
		{heldItemState}
		flip={entity.direction === 'right'}
		{selected}
		class="absolute -translate-x-1/2 -translate-y-1/2"
		style="left: {entity.x + (characterBody?.collider_offset_x ?? 0)}px; top: {entity.y +
			(characterBody?.collider_offset_y ?? 0)}px; opacity: {opacity};"
	/>
{/if}
