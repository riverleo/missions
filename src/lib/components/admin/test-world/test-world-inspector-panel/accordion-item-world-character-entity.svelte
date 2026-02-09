<script lang="ts">
	import { useBehavior, useBuilding, useCharacter, useItem, useWorld } from '$lib/hooks';
	import type { WorldCharacterEntity } from '$lib/components/app/world/entities/world-character-entity';
	import type { WorldContext } from '$lib/components/app/world/context';
	import type {
		NeedBehaviorId,
		NeedBehaviorActionId,
		ConditionBehaviorId,
		ConditionBehaviorActionId,
		WorldBuildingId,
		WorldItemId,
		WorldCharacterId,
	} from '$lib/types';
	import { BehaviorIdUtils } from '$lib/utils/behavior-id';
	import { getBehaviorActionString } from '$lib/utils/label';
	import { AccordionItem, AccordionTrigger, AccordionContent } from '$lib/components/ui/accordion';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { IconTrash } from '@tabler/icons-svelte';
	import { EntityIdUtils } from '$lib/utils/entity-id';
	import AccordionContentItem from './accordion-content-item.svelte';

	interface Props {
		entity: WorldCharacterEntity;
		worldContext?: WorldContext;
	}

	let { entity, worldContext }: Props = $props();

	const { getWorldCharacter, getWorldBuilding, getWorldItem } = useWorld();
	const { getOrUndefinedCharacter, getOrUndefinedNeed } = useCharacter();
	const { getOrUndefinedBuilding } = useBuilding();
	const { getOrUndefinedItem } = useItem();
	const { getNeedBehavior, getNeedBehaviorAction, getConditionBehavior, getConditionBehaviorAction } =
		useBehavior();

	const worldCharacter = $derived(getWorldCharacter(entity.instanceId));
	const character = $derived(
		worldCharacter ? getOrUndefinedCharacter(worldCharacter.character_id) : undefined
	);
	const needs = $derived(Object.values(entity.needs));

	// 현재 대상 이름
	const currentTargetName = $derived.by(() => {
		if (!entity.behavior.targetEntityId) return undefined;

		const { type, instanceId } = EntityIdUtils.parse(entity.behavior.targetEntityId);

		if (type === 'building') {
			const worldBuilding = getWorldBuilding(instanceId as WorldBuildingId);
			if (!worldBuilding) return undefined;
			const building = getOrUndefinedBuilding(worldBuilding.building_id);
			return building?.name;
		} else if (type === 'item') {
			const worldItem = getWorldItem(instanceId as WorldItemId);
			if (!worldItem) return undefined;
			const item = getOrUndefinedItem(worldItem.item_id);
			return item?.name;
		} else if (type === 'character') {
			const worldChar = getWorldCharacter(instanceId as WorldCharacterId);
			if (!worldChar) return undefined;
			const char = getOrUndefinedCharacter(worldChar.character_id);
			return char?.name;
		}

		return undefined;
	});

	// 현재 행동 이름
	const currentBehaviorName = $derived.by(() => {
		if (!entity.behavior.behaviorTargetId) return undefined;

		const { type } = BehaviorIdUtils.parse(entity.behavior.behaviorTargetId);

		if (type === 'need') {
			const behaviorId = BehaviorIdUtils.behaviorId(entity.behavior.behaviorTargetId);
			const behavior = getNeedBehavior(behaviorId as NeedBehaviorId);
			return behavior?.name ?? '행동';
		} else {
			const behaviorId = BehaviorIdUtils.behaviorId(entity.behavior.behaviorTargetId);
			const behavior = getConditionBehavior(behaviorId as ConditionBehaviorId);
			return behavior?.name ?? '컨디션';
		}
	});

	// 현재 행동 액션 라벨
	const currentBehaviorActionLabel = $derived.by(() => {
		if (!entity.behavior.behaviorTargetId) return undefined;

		const { type } = BehaviorIdUtils.parse(entity.behavior.behaviorTargetId);

		if (type === 'need') {
			const behaviorActionId = BehaviorIdUtils.behaviorActionId(entity.behavior.behaviorTargetId);
			const action = getNeedBehaviorAction(behaviorActionId as NeedBehaviorActionId);
			if (!action) return undefined;
			return getBehaviorActionString(action);
		} else {
			const behaviorActionId = BehaviorIdUtils.behaviorActionId(entity.behavior.behaviorTargetId);
			const action = getConditionBehaviorAction(behaviorActionId as ConditionBehaviorActionId);
			if (!action) return undefined;
			return getBehaviorActionString(action);
		}
	});

	// behaviors 툴팁
	const behaviorsTooltip = $derived.by(() => {
		if (!entity.behavior.behaviors || entity.behavior.behaviors.length === 0) {
			return undefined;
		}

		return entity.behavior.behaviors.map((behavior) => {
			if (behavior.behaviorType === 'need') {
				const needBehavior = getNeedBehavior(behavior.id as NeedBehaviorId);
				return needBehavior?.name ?? '행동';
			} else {
				const conditionBehavior = getConditionBehavior(behavior.id as ConditionBehaviorId);
				return conditionBehavior?.name ?? '컨디션';
			}
		});
	});

	// 소지 아이템 툴팁
	const heldItemsTooltip = $derived.by(() => {
		if (entity.heldItemIds.length === 0) return undefined;

		const { getOrUndefinedItemByWorldItem } = useItem();
		return entity.heldItemIds.map((itemId) => {
			const item = getOrUndefinedItemByWorldItem(EntityIdUtils.instanceId(itemId) as WorldItemId);
			const idPrefix = itemId.split('-')[0];
			return item ? `${item.name} (${idPrefix})` : `아이템 (${idPrefix})`;
		});
	});
</script>

<AccordionItem value={entity.id}>
	<AccordionTrigger class="gap-3 py-3 text-xs">
		<div class="flex flex-1 items-center justify-between">
			<div>
				{character?.name ?? '캐릭터'} ({entity.id.split('-')[0]})
				<Badge variant="secondary">캐릭터</Badge>
			</div>
			<Button
				size="icon-sm"
				variant="ghost"
				class="size-3"
				onclick={(e) => {
					e.stopPropagation();
					worldContext?.deleteWorldCharacter(entity.instanceId);
				}}
			>
				<IconTrash />
			</Button>
		</div>
	</AccordionTrigger>
	<AccordionContent class="flex flex-col gap-3 pb-3">
		<Separator />
		<AccordionContentItem label="월드 좌표">
			({Math.round(entity.x)}, {Math.round(entity.y)})
		</AccordionContentItem>
		<AccordionContentItem label="행동" tooltip={behaviorsTooltip}>
			{currentBehaviorName ?? '없음'}
		</AccordionContentItem>
		<AccordionContentItem label="행동 액션">
			{currentBehaviorActionLabel ?? '없음'}
		</AccordionContentItem>
		<AccordionContentItem label="대상">
			{currentTargetName ?? '없음'}
		</AccordionContentItem>
		<AccordionContentItem label="소지 아이템" tooltip={heldItemsTooltip}>
			{#if entity.heldItemIds.length > 0}
				{entity.heldItemIds.length}개
			{:else}
				없음
			{/if}
		</AccordionContentItem>
		{#each needs as need}
			{@const needData = getOrUndefinedNeed(need.need_id)}
			<AccordionContentItem label={needData?.name ?? need.need_id}>
				{need.value} / {needData?.max_value ?? 100}
			</AccordionContentItem>
		{/each}
	</AccordionContent>
</AccordionItem>
