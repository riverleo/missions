<script lang="ts">
	import type { EntityId, BuildingId, CharacterId, ItemId } from '$lib/types';
	import { EntityIdUtils } from '$lib/utils/entity-id';
	import CharacterSpriteAnimator from './character-sprite-animator.svelte';
	import ItemSpriteAnimator from './item-sprite-animator.svelte';
	import BuildingSpriteAnimator from './building-sprite-animator.svelte';

	interface Props {
		entityId: EntityId;
		resolution?: 1 | 2 | 3;
	}

	let { entityId, resolution = 1 }: Props = $props();

	const { type, value: id } = EntityIdUtils.parse(entityId);
</script>

{#if type === 'character'}
	<CharacterSpriteAnimator
		characterId={id as CharacterId}
		bodyStateType="idle"
		faceStateType="idle"
		{resolution}
	/>
{:else if type === 'item'}
	<ItemSpriteAnimator itemId={id as ItemId} stateType="idle" {resolution} />
{:else if type === 'building'}
	<BuildingSpriteAnimator buildingId={id as BuildingId} stateType="idle" {resolution} />
{/if}
