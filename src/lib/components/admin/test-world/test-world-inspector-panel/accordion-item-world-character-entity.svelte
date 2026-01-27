<script lang="ts">
	import type { WorldCharacterEntity } from '$lib/components/app/world/entities/world-character-entity';
	import type { WorldContext } from '$lib/components/app/world/context';
	import type {
		NeedBehaviorId,
		NeedBehaviorActionId,
		ConditionBehaviorId,
		ConditionBehaviorActionId,
	} from '$lib/types';
	import { useWorld } from '$lib/hooks/use-world';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useItem } from '$lib/hooks/use-item';
	import { useBehavior } from '$lib/hooks/use-behavior';
	import { BehaviorActionIdUtils } from '$lib/utils/behavior-action-id';
	import { getBehaviorActionLabel } from '$lib/utils/state-label';
	import { AccordionItem, AccordionTrigger, AccordionContent } from '$lib/components/ui/accordion';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { IconTrash } from '@tabler/icons-svelte';
	import AccordionContentItem from './accordion-content-item.svelte';

	interface Props {
		entity: WorldCharacterEntity;
		worldContext?: WorldContext;
	}

	let { entity, worldContext }: Props = $props();

	const { worldCharacterStore } = useWorld();
	const { characterStore, needStore } = useCharacter();
	const { buildingStore } = useBuilding();
	const { itemStore } = useItem();
	const {
		needBehaviorStore,
		needBehaviorActionStore,
		conditionBehaviorStore,
		conditionBehaviorActionStore,
	} = useBehavior();

	const worldCharacter = $derived($worldCharacterStore.data[entity.instanceId]);
	const character = $derived(
		worldCharacter ? $characterStore.data[worldCharacter.character_id] : undefined
	);
	const needs = $derived(Object.values(entity.worldCharacterNeeds));

	// 현재 행동 정보
	const currentBehaviorInfo = $derived.by(() => {
		if (!entity.currentBehaviorActionId) return undefined;

		const { type } = BehaviorActionIdUtils.parse(entity.currentBehaviorActionId);

		if (type === 'need') {
			const behaviorId =
				BehaviorActionIdUtils.behaviorId<NeedBehaviorId>(entity.currentBehaviorActionId);
			const actionId = BehaviorActionIdUtils.actionId<NeedBehaviorActionId>(
				entity.currentBehaviorActionId
			);

			const behavior = $needBehaviorStore.data[behaviorId];
			const action = $needBehaviorActionStore.data[actionId];

			if (!action) return undefined;

			// building/item 이름 가져오기
			const buildingName = action.building_id
				? $buildingStore.data[action.building_id]?.name
				: undefined;
			const itemName = action.item_id ? $itemStore.data[action.item_id]?.name : undefined;

			const actionLabel = getBehaviorActionLabel({
				action,
				buildingName,
				itemName,
			});

			return {
				type: 'need' as const,
				behaviorName: behavior?.name ?? '행동',
				actionLabel,
			};
		} else {
			const behaviorId = BehaviorActionIdUtils.behaviorId<ConditionBehaviorId>(
				entity.currentBehaviorActionId
			);
			const actionId = BehaviorActionIdUtils.actionId<ConditionBehaviorActionId>(
				entity.currentBehaviorActionId
			);

			const behavior = $conditionBehaviorStore.data[behaviorId];
			const action = $conditionBehaviorActionStore.data[actionId];

			if (!action) return undefined;

			const buildingName = action.building_id
				? $buildingStore.data[action.building_id]?.name
				: undefined;
			const itemName = action.item_id ? $itemStore.data[action.item_id]?.name : undefined;

			const actionLabel = getBehaviorActionLabel({
				action,
				buildingName,
				itemName,
			});

			return {
				type: 'condition' as const,
				behaviorName: behavior?.name ?? '컨디션',
				actionLabel,
			};
		}
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
		<AccordionContentItem label="현재 행동">
			{#if currentBehaviorInfo}
				<div class="flex flex-col items-end">
					<div>{currentBehaviorInfo.behaviorName}</div>
					<div class="text-xs text-muted-foreground">{currentBehaviorInfo.actionLabel}</div>
				</div>
			{:else}
				없음
			{/if}
		</AccordionContentItem>
		<AccordionContentItem label="현재 타겟">
			{entity.currentTargetEntityId ?? '없음'}
		</AccordionContentItem>
		{#each needs as need}
			{@const needData = $needStore.data[need.need_id]}
			<AccordionContentItem label={needData?.name ?? need.need_id}>
				{need.value} / {needData?.max_value ?? 100}
			</AccordionContentItem>
		{/each}
	</AccordionContent>
</AccordionItem>
