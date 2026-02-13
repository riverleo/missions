<script lang="ts">
	import { useBehavior, useBuilding, useCharacter, useItem } from '$lib/hooks';
	import type { WorldCharacterEntity } from '$lib/components/app/world/entities/world-character-entity';
	import type { WorldContext } from '$lib/components/app/world/context';
	import { BehaviorIdUtils } from '$lib/utils/behavior-id';
	import {
		getBehaviorActionString,
		getDisplayNameWithId,
		getInteractionTargetLabelString,
		getInteractionQueueStatusLabel,
	} from '$lib/utils/label';
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

	const { getCharacter, getOrUndefinedNeed } = useCharacter();
	const { getBuilding } = useBuilding();
	const { getItem } = useItem();
	const {
		getOrUndefinedNeedBehavior,
		getOrUndefinedNeedBehaviorAction,
		getOrUndefinedConditionBehavior,
		getOrUndefinedConditionBehaviorAction,
	} = useBehavior();

	const character = $derived(getCharacter(entity.sourceId));
	const characterLabel = $derived(
		getDisplayNameWithId(character?.name, entity.instanceId, '캐릭터')
	);
	const needs = $derived(Object.values(entity.needs));

	// 현재 대상 이름
	const currentTargetName = $derived.by(() => {
		if (!entity.behavior.targetEntityId) return undefined;

		const { type } = EntityIdUtils.parse(entity.behavior.targetEntityId);

		if (type === 'building') {
			const buildingId = EntityIdUtils.sourceId(entity.behavior.targetEntityId);
			return getBuilding(buildingId).name;
		} else if (type === 'item') {
			const itemId = EntityIdUtils.sourceId(entity.behavior.targetEntityId);
			return getItem(itemId).name;
		} else if (type === 'character') {
			const characterId = EntityIdUtils.sourceId(entity.behavior.targetEntityId);
			return getCharacter(characterId).name;
		}

		return undefined;
	});

	// 현재 행동 이름
	const currentBehaviorName = $derived.by(() => {
		if (!entity.behavior.behaviorTargetId) return undefined;

		const { type } = BehaviorIdUtils.parse(entity.behavior.behaviorTargetId);

		if (type === 'need') {
			const behaviorId = BehaviorIdUtils.behaviorId(entity.behavior.behaviorTargetId);
			const behavior = getOrUndefinedNeedBehavior(behaviorId);
			return behavior?.name ?? '행동';
		} else {
			const behaviorId = BehaviorIdUtils.behaviorId(entity.behavior.behaviorTargetId);
			const behavior = getOrUndefinedConditionBehavior(behaviorId);
			return behavior?.name ?? '컨디션';
		}
	});

	// 현재 행동 액션 라벨
	const currentBehaviorActionLabel = $derived.by(() => {
		if (!entity.behavior.behaviorTargetId) return undefined;

		const { type } = BehaviorIdUtils.parse(entity.behavior.behaviorTargetId);

		if (type === 'need') {
			const behaviorActionId = BehaviorIdUtils.behaviorActionId(entity.behavior.behaviorTargetId);
			const action = getOrUndefinedNeedBehaviorAction(behaviorActionId);
			if (!action) return undefined;
			return getBehaviorActionString(action);
		} else {
			const behaviorActionId = BehaviorIdUtils.behaviorActionId(entity.behavior.behaviorTargetId);
			const action = getOrUndefinedConditionBehaviorAction(behaviorActionId);
			if (!action) return undefined;
			return getBehaviorActionString(action);
		}
	});

	const currentInteractionActionStatusLabel = $derived.by(() => {
		const { status } = entity.behavior.interactionQueue;
		return getInteractionQueueStatusLabel(status);
	});

	// 상호작용 액션 디버그 툴팁 (interactionTargetIds)
	const interactionTargetIdsTooltip = $derived.by(() => {
		const { interactionTargetIds, currentInteractionTargetId } = entity.behavior.interactionQueue;

		return interactionTargetIds.map((interactionTargetId) => {
			const currentMark = interactionTargetId === currentInteractionTargetId ? ' (현재)' : '';
			return `${getInteractionTargetLabelString(interactionTargetId)}${currentMark}`;
		});
	});

	// 소지 아이템 툴팁
	const heldItemsTooltip = $derived.by(() => {
		if (entity.heldItemIds.length === 0) return undefined;

		const { getOrUndefinedItem } = useItem();
		return entity.heldItemIds.map((itemId) => {
			const item = getOrUndefinedItem(EntityIdUtils.sourceId(itemId));
			return getDisplayNameWithId(item?.name, itemId, '아이템');
		});
	});
</script>

<AccordionItem value={entity.id}>
	<AccordionTrigger class="gap-3 py-3 text-xs">
		<div class="flex flex-1 items-center justify-between">
			<div>
				{characterLabel}
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
		<AccordionContentItem label="행동">
			{currentBehaviorName ?? '없음'}
		</AccordionContentItem>
		<AccordionContentItem label="행동 액션">
			{currentBehaviorActionLabel ?? '없음'}
		</AccordionContentItem>
		<AccordionContentItem label="상호작용 액션" tooltip={interactionTargetIdsTooltip}>
			{currentInteractionActionStatusLabel}
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
