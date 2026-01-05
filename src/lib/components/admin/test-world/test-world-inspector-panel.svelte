<script lang="ts">
	import { useWorldTest, useWorld } from '$lib/hooks/use-world';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useItem } from '$lib/hooks/use-item';
	import type { WorldContext } from '$lib/components/app/world/context';
	import type { WorldCharacterEntity } from '$lib/components/app/world/entities/world-character-entity';
	import type { WorldBuildingEntity } from '$lib/components/app/world/entities/world-building-entity';
	import type { WorldItemEntity } from '$lib/components/app/world/entities/world-item-entity';
	import type { EntityId } from '$lib/types';
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger,
	} from '$lib/components/ui/accordion';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { IconTrash } from '@tabler/icons-svelte';
	import TestWorldInspectorItem from './test-world-inspector-item.svelte';

	interface Props {
		worldContext?: WorldContext;
	}

	let { worldContext }: Props = $props();

	const { store, removeWorldCharacter, removeWorldBuilding, removeWorldItem } = useWorldTest();
	const {
		worldCharacterStore,
		worldBuildingStore,
		worldItemStore,
		selectedEntityIdStore,
		setSelectedEntityId,
	} = useWorld();
	const { store: characterStore } = useCharacter();
	const { store: buildingStore } = useBuilding();
	const { store: itemStore } = useItem();

	// TODO: 틱 시스템 구현 후 실제 틱 데이터 연결
	const currentTick = $derived(0);

	// WorldContext에서 실시간 엔티티 정보 가져오기
	const entities = $derived(worldContext ? Object.values(worldContext.entities) : []);

	// 아코디언 value (entityId 기반)
	const accordionValue = $derived.by(() => {
		const entityId = $selectedEntityIdStore.entityId;
		if (!entityId) return 'world';

		return entityId;
	});

	function onResetTick() {
		// TODO: 틱 초기화 로직
		console.log('Reset tick');
	}

	function onValueChange(value: string | undefined) {
		if (!value || value === 'world') {
			setSelectedEntityId(undefined);
		} else {
			// value는 EntityId 형태 ("character-{id}", "building-{id}", "item-{id}")
			setSelectedEntityId(value as EntityId);
		}
	}
</script>

<Accordion type="single" value={accordionValue} {onValueChange} class="px-3 py-1">
	<AccordionItem value="world">
		<AccordionTrigger class="py-3 text-xs">월드 정보</AccordionTrigger>
		<AccordionContent class="pb-3">
			<TestWorldInspectorItem label="현재 틱">
				<div class="flex items-center gap-2">
					{currentTick}
					<Button
						size="sm"
						variant="ghost"
						class="h-auto rounded-sm px-2 py-1 text-xs"
						onclick={onResetTick}
					>
						초기화
					</Button>
				</div>
			</TestWorldInspectorItem>
		</AccordionContent>
	</AccordionItem>

	{#each entities as entity (entity.id)}
		{#if entity.type === 'character'}
			{@const characterEntity = entity as WorldCharacterEntity}
			{@const worldCharacter = $worldCharacterStore.data[characterEntity.id]}
			{@const characterData = worldCharacter
				? $characterStore.data[worldCharacter.character_id]
				: undefined}
			<AccordionItem value={characterEntity.toEntityId()}>
				<AccordionTrigger class="gap-3 py-3 text-xs">
					<div class="flex flex-1 items-center justify-between">
						<div>
							{characterData?.name ?? '캐릭터'} ({characterEntity.id.split('-')[0]})
							<Badge variant="secondary">캐릭터</Badge>
						</div>
						<Button
							size="icon-sm"
							variant="ghost"
							class="size-3"
							onclick={(e) => {
								e.stopPropagation();
								removeWorldCharacter(characterEntity.id);
							}}
						>
							<IconTrash />
						</Button>
					</div>
				</AccordionTrigger>
				<AccordionContent class="pb-3">
					<TestWorldInspectorItem label="좌표">
						({Math.round(characterEntity.x)}, {Math.round(characterEntity.y)})
					</TestWorldInspectorItem>
				</AccordionContent>
			</AccordionItem>
		{:else if entity.type === 'building'}
			{@const buildingEntity = entity as WorldBuildingEntity}
			{@const worldBuilding = $worldBuildingStore.data[buildingEntity.id]}
			{@const buildingData = worldBuilding
				? $buildingStore.data[worldBuilding.building_id]
				: undefined}
			<AccordionItem value={buildingEntity.toEntityId()}>
				<AccordionTrigger class="gap-3 py-3 text-xs">
					<div class="flex flex-1 items-center justify-between">
						<div>
							{buildingData?.name ?? '건물'} ({buildingEntity.id.split('-')[0]})
							<Badge variant="secondary">건물</Badge>
						</div>
						<Button
							size="icon-sm"
							variant="ghost"
							class="size-3"
							onclick={(e) => {
								e.stopPropagation();
								removeWorldBuilding(buildingEntity.id);
							}}
						>
							<IconTrash />
						</Button>
					</div>
				</AccordionTrigger>
				<AccordionContent class="pb-3">
					<TestWorldInspectorItem label="타일 좌표">
						({worldBuilding?.tile_x ?? 0}, {worldBuilding?.tile_y ?? 0})
					</TestWorldInspectorItem>
				</AccordionContent>
			</AccordionItem>
		{:else if entity.type === 'item'}
			{@const itemEntity = entity as WorldItemEntity}
			{@const worldItem = $worldItemStore.data[itemEntity.id]}
			{@const itemData = worldItem ? $itemStore.data[worldItem.item_id] : undefined}
			<AccordionItem value={itemEntity.toEntityId()}>
				<AccordionTrigger class="gap-3 py-3 text-xs">
					<div class="flex flex-1 items-center justify-between">
						<div>
							{itemData?.name ?? '아이템'} ({itemEntity.id.split('-')[0]})
							<Badge variant="secondary">아이템</Badge>
						</div>
						<Button
							size="icon-sm"
							variant="ghost"
							class="size-3"
							onclick={(e) => {
								e.stopPropagation();
								removeWorldItem(itemEntity.id);
							}}
						>
							<IconTrash />
						</Button>
					</div>
				</AccordionTrigger>
				<AccordionContent class="pb-3">
					<TestWorldInspectorItem label="좌표와 각도">
						({Math.round(itemEntity.x)}, {Math.round(itemEntity.y)}), {Math.round(
							(itemEntity.angle * 180) / Math.PI
						)}°
					</TestWorldInspectorItem>
				</AccordionContent>
			</AccordionItem>
		{/if}
	{/each}
</Accordion>
