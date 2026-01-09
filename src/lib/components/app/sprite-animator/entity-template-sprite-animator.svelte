<script lang="ts">
	import type { EntityTemplateId, BuildingId, CharacterId, ItemId, TileId } from '$lib/types';
	import { EntityIdUtils } from '$lib/utils/entity-id';
	import CharacterSpriteAnimator from './character-sprite-animator.svelte';
	import ItemSpriteAnimator from './item-sprite-animator.svelte';
	import BuildingSpriteAnimator from './building-sprite-animator.svelte';
	import TileSpriteAnimator from './tile-sprite-animator.svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		entityTemplateId: EntityTemplateId;
		resolution?: 1 | 2 | 3;
	}

	let { entityTemplateId, resolution = 1, ...restProps }: Props = $props();

	const { type, value: id } = EntityIdUtils.template.parse(entityTemplateId);
</script>

{#if type === 'character'}
	<CharacterSpriteAnimator
		characterId={id as CharacterId}
		bodyStateType="idle"
		faceStateType="idle"
		{resolution}
		{...restProps}
	/>
{:else if type === 'item'}
	<ItemSpriteAnimator itemId={id as ItemId} stateType="idle" {resolution} {...restProps} />
{:else if type === 'building'}
	<BuildingSpriteAnimator
		buildingId={id as BuildingId}
		stateType="idle"
		{resolution}
		{...restProps}
	/>
{:else if type === 'tile'}
	<TileSpriteAnimator
		tileId={id as TileId}
		stateType="idle"
		index={1}
		{resolution}
		{...restProps}
	/>
{/if}
