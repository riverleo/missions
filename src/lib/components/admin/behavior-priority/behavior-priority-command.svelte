<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import {
		Command,
		CommandInput,
		CommandList,
		CommandEmpty,
		CommandGroup,
	} from '$lib/components/ui/command';
	import { useBehaviorPriority } from '$lib/hooks/use-behavior-priority';
	import { useNeedBehavior } from '$lib/hooks/use-need-behavior';
	import { useConditionBehavior } from '$lib/hooks/use-condition-behavior';
	import { useItemBehavior } from '$lib/hooks/use-item-behavior';
	import { page } from '$app/state';
	import type { ScenarioId, NeedBehavior, ConditionBehavior, ItemBehavior } from '$lib/types';
	import NeedBehaviorCommandItem from '../need-behavior/need-behavior-command-item.svelte';
	import ConditionBehaviorCommandItem from '../condition-behavior/condition-behavior-command-item.svelte';
	import ItemBehaviorCommandItem from '../item-behavior/item-behavior-command-item.svelte';

	const { store: behaviorPriorityStore, admin } = useBehaviorPriority();
	const { needBehaviorStore } = useNeedBehavior();
	const { conditionBehaviorStore } = useConditionBehavior();
	const { itemBehaviorStore } = useItemBehavior();

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	async function addNeedBehaviorToPriority(behavior: NeedBehavior) {
		const priorities = Object.values($behaviorPriorityStore.data);
		const maxPriority = Math.max(0, ...priorities.map((p) => p.priority));

		try {
			await admin.create({
				need_behavior_id: behavior.id,
				priority: maxPriority + 1,
			});
		} catch (error) {
			console.error('Failed to add behavior to priority:', error);
		}
	}

	async function addConditionBehaviorToPriority(behavior: ConditionBehavior) {
		const priorities = Object.values($behaviorPriorityStore.data);
		const maxPriority = Math.max(0, ...priorities.map((p) => p.priority));

		try {
			await admin.create({
				condition_behavior_id: behavior.id,
				priority: maxPriority + 1,
			});
		} catch (error) {
			console.error('Failed to add behavior to priority:', error);
		}
	}

	async function addItemBehaviorToPriority(behavior: ItemBehavior) {
		const priorities = Object.values($behaviorPriorityStore.data);
		const maxPriority = Math.max(0, ...priorities.map((p) => p.priority));

		try {
			await admin.create({
				item_behavior_id: behavior.id,
				priority: maxPriority + 1,
			});
		} catch (error) {
			console.error('Failed to add behavior to priority:', error);
		}
	}

	// 우선도가 설정되지 않은 행동들만 표시
	const behaviorsWithoutPriority = $derived(() => {
		const priorities = Object.values($behaviorPriorityStore.data);
		const priorityNeedBehaviorIds = new Set(
			priorities.map((p) => p.need_behavior_id).filter(Boolean)
		);
		const priorityConditionBehaviorIds = new Set(
			priorities.map((p) => p.condition_behavior_id).filter(Boolean)
		);
		const priorityItemBehaviorIds = new Set(
			priorities.map((p) => p.item_behavior_id).filter(Boolean)
		);

		const needBehaviors = Object.values($needBehaviorStore.data).filter(
			(behavior) => !priorityNeedBehaviorIds.has(behavior.id)
		);

		const conditionBehaviors = Object.values($conditionBehaviorStore.data).filter(
			(behavior) => !priorityConditionBehaviorIds.has(behavior.id)
		);

		const itemBehaviors = Object.values($itemBehaviorStore.data).filter(
			(behavior) => !priorityItemBehaviorIds.has(behavior.id)
		);

		return {
			need: needBehaviors,
			condition: conditionBehaviors,
			item: itemBehaviors,
		};
	});

	const hasAnyBehaviors = $derived(
		behaviorsWithoutPriority().need.length > 0 ||
			behaviorsWithoutPriority().condition.length > 0 ||
			behaviorsWithoutPriority().item.length > 0
	);
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="행동 검색..." />
	{#if hasAnyBehaviors}
		<CommandList class="max-h-80">
			<CommandEmpty>검색 결과가 없습니다</CommandEmpty>

			<!-- 욕구 행동 그룹 -->
			{#if behaviorsWithoutPriority().need.length > 0}
				<CommandGroup heading="욕구 행동">
					{#each behaviorsWithoutPriority().need as behavior (behavior.id)}
						<button
							type="button"
							onclick={() => addNeedBehaviorToPriority(behavior)}
							class="w-full text-left"
						>
							<NeedBehaviorCommandItem {behavior} showActions={false} />
						</button>
					{/each}
				</CommandGroup>
			{/if}

			<!-- 컨디션 행동 그룹 -->
			{#if behaviorsWithoutPriority().condition.length > 0}
				<CommandGroup heading="컨디션 행동">
					{#each behaviorsWithoutPriority().condition as behavior (behavior.id)}
						<button
							type="button"
							onclick={() => addConditionBehaviorToPriority(behavior)}
							class="w-full text-left"
						>
							<ConditionBehaviorCommandItem {behavior} showActions={false} />
						</button>
					{/each}
				</CommandGroup>
			{/if}

			<!-- 아이템 행동 그룹 -->
			{#if behaviorsWithoutPriority().item.length > 0}
				<CommandGroup heading="아이템 행동">
					{#each behaviorsWithoutPriority().item as behavior (behavior.id)}
						<button
							type="button"
							onclick={() => addItemBehaviorToPriority(behavior)}
							class="w-full text-left"
						>
							<ItemBehaviorCommandItem {behavior} showActions={false} />
						</button>
					{/each}
				</CommandGroup>
			{/if}
		</CommandList>
	{:else}
		<div class="p-6 text-center text-sm text-muted-foreground">설정 완료</div>
	{/if}
</Command>
