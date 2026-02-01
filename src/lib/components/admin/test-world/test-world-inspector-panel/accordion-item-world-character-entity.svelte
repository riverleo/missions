<script lang="ts">
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
	import { useWorld } from '$lib/hooks/use-world';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useItem } from '$lib/hooks/use-item';
	import { useBehavior } from '$lib/hooks/use-behavior';
	import { BehaviorIdUtils } from '$lib/utils/behavior-id';
	import { getBehaviorActionLabel } from '$lib/utils/state-label';
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

	const { worldCharacterStore, worldBuildingStore, worldItemStore } = useWorld();
	const { characterStore, needStore } = useCharacter();
	const { buildingStore, buildingInteractionStore } = useBuilding();
	const { itemStore, itemInteractionStore } = useItem();
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

	// 현재 대상 이름
	const currentTargetName = $derived.by(() => {
		if (!entity.currentTargetEntityId) return undefined;

		const { type, instanceId } = EntityIdUtils.parse(entity.currentTargetEntityId);

		if (type === 'building') {
			const worldBuilding = $worldBuildingStore.data[instanceId as WorldBuildingId];
			if (!worldBuilding) return undefined;
			const building = $buildingStore.data[worldBuilding.building_id];
			return building?.name;
		} else if (type === 'item') {
			const worldItem = $worldItemStore.data[instanceId as WorldItemId];
			if (!worldItem) return undefined;
			const item = $itemStore.data[worldItem.item_id];
			return item?.name;
		} else if (type === 'character') {
			const worldChar = $worldCharacterStore.data[instanceId as WorldCharacterId];
			if (!worldChar) return undefined;
			const char = $characterStore.data[worldChar.character_id];
			return char?.name;
		}

		return undefined;
	});

	// 현재 행동 정보
	const currentBehaviorInfo = $derived.by(() => {
		if (!entity.currentBehaviorId) return undefined;

		const { type } = BehaviorIdUtils.parse(entity.currentBehaviorId);

		if (type === 'need') {
			const behaviorId = BehaviorIdUtils.behaviorId(entity.currentBehaviorId);
			const behaviorActionId = BehaviorIdUtils.behaviorActionId(entity.currentBehaviorId);

			const behavior = $needBehaviorStore.data[behaviorId as NeedBehaviorId];
			const action = $needBehaviorActionStore.data[behaviorActionId as NeedBehaviorActionId];

			if (!action) return undefined;

			// Get names from interactions
			let buildingName: string | undefined;
			let itemName: string | undefined;

			if (action.building_interaction_id) {
				const interaction = $buildingInteractionStore.data[action.building_interaction_id];
				if (interaction) {
					buildingName = $buildingStore.data[interaction.building_id]?.name;
				}
			}

			if (action.item_interaction_id) {
				const interaction = $itemInteractionStore.data[action.item_interaction_id];
				if (interaction) {
					itemName = $itemStore.data[interaction.item_id]?.name;
				}
			}

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
			const behaviorId = BehaviorIdUtils.behaviorId(entity.currentBehaviorId);
			const behaviorActionId = BehaviorIdUtils.behaviorActionId(entity.currentBehaviorId);

			const behavior = $conditionBehaviorStore.data[behaviorId as ConditionBehaviorId];
			const action = $conditionBehaviorActionStore.data[behaviorActionId as ConditionBehaviorActionId];

			if (!action) return undefined;

			// Get names from interactions
			let buildingName: string | undefined;
			let itemName: string | undefined;

			if (action.building_interaction_id) {
				const interaction = $buildingInteractionStore.data[action.building_interaction_id];
				if (interaction) {
					buildingName = $buildingStore.data[interaction.building_id]?.name;
				}
			}

			if (action.item_interaction_id) {
				const interaction = $itemInteractionStore.data[action.item_interaction_id];
				if (interaction) {
					itemName = $itemStore.data[interaction.item_id]?.name;
				}
			}

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
		<AccordionContentItem label="행동">
			{currentBehaviorInfo?.behaviorName ?? '없음'}
		</AccordionContentItem>
		<AccordionContentItem label="행동 액션">
			{currentBehaviorInfo?.actionLabel ?? '없음'}
		</AccordionContentItem>
		<AccordionContentItem label="대상">
			{currentTargetName ?? '없음'}
		</AccordionContentItem>
		<AccordionContentItem label="들고 있는 아이템">
			{#if entity.heldWorldItemIds.length > 0}
				{entity.heldWorldItemIds.length}개
			{:else}
				없음
			{/if}
		</AccordionContentItem>
		{#each needs as need}
			{@const needData = $needStore.data[need.need_id]}
			<AccordionContentItem label={needData?.name ?? need.need_id}>
				{need.value} / {needData?.max_value ?? 100}
			</AccordionContentItem>
		{/each}
	</AccordionContent>
</AccordionItem>
