<script lang="ts">
	import { useWorldTest, useWorld, TEST_WORLD_ID } from '$lib/hooks/use-world';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useItem } from '$lib/hooks/use-item';
	import type { WorldContext } from '$lib/components/app/world/context';
	import type { WorldCharacterEntity } from '$lib/components/app/world/entities/world-character-entity';
	import type { WorldBuildingEntity } from '$lib/components/app/world/entities/world-building-entity';
	import type { WorldItemEntity } from '$lib/components/app/world/entities/world-item-entity';
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger,
	} from '$lib/components/ui/accordion';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupText,
		InputGroupInput,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		worldContext?: WorldContext;
	}

	let { worldContext }: Props = $props();

	const { store } = useWorldTest();
	const {
		worldCharacterStore,
		worldBuildingStore,
		worldItemStore,
		selectedEntityStore,
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
		const entityId = $selectedEntityStore.entityId;
		if (!entityId) return 'world';

		return `${entityId.type}-${entityId.value}`;
	});

	function onResetTick() {
		// TODO: 틱 초기화 로직
		console.log('Reset tick');
	}

	function onValueChange(value: string | undefined) {
		if (!value || value === 'world') {
			setSelectedEntityId(undefined);
		} else {
			// value는 "character-{id}" 또는 "building-{id}" 형태
			const parts = value.split('-');
			if (parts.length > 1) {
				const type = parts[0] as 'character' | 'building' | 'item';
				const id = parts.slice(1).join('-');
				setSelectedEntityId({ value: id, type });
			}
		}
	}
</script>

<Accordion type="single" value={accordionValue} {onValueChange} class="px-3 py-1">
	<AccordionItem value="world">
		<AccordionTrigger class="py-3 text-xs">월드 정보</AccordionTrigger>
		<AccordionContent class="pb-3">
			<div class="flex flex-col gap-2">
				<InputGroup>
					<InputGroupAddon>
						<InputGroupText>현재 틱</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput type="number" value={currentTick} disabled />
					<InputGroupAddon align="inline-end">
						<InputGroupButton onclick={onResetTick}>초기화</InputGroupButton>
					</InputGroupAddon>
				</InputGroup>
			</div>
		</AccordionContent>
	</AccordionItem>

	{#each entities as entity (entity.id)}
		{#if entity.type === 'character'}
			{@const characterEntity = entity as WorldCharacterEntity}
			{@const worldCharacter = $worldCharacterStore.data[characterEntity.id]}
			{@const characterData = worldCharacter
				? $characterStore.data[worldCharacter.character_id]
				: undefined}
			<AccordionItem value={`character-${characterEntity.id}`}>
				<AccordionTrigger class="py-3 text-xs">
					<div class="flex items-center gap-2">
						<Badge variant="secondary">캐릭터</Badge>
						{characterData?.name ?? '캐릭터'} ({characterEntity.id.split('-')[0]})
					</div>
				</AccordionTrigger>
				<AccordionContent class="pb-3">
					<div class="flex flex-col gap-2">
						<InputGroup>
							<InputGroupAddon>
								<InputGroupText>좌표</InputGroupText>
							</InputGroupAddon>
							<InputGroupInput value={Math.round(characterEntity.x)} disabled />
							<InputGroupInput value={Math.round(characterEntity.y)} disabled />
						</InputGroup>
					</div>
				</AccordionContent>
			</AccordionItem>
		{:else if entity.type === 'building'}
			{@const buildingEntity = entity as WorldBuildingEntity}
			{@const worldBuilding = $worldBuildingStore.data[buildingEntity.id]}
			{@const buildingData = worldBuilding
				? $buildingStore.data[worldBuilding.building_id]
				: undefined}
			<AccordionItem value={`building-${buildingEntity.id}`}>
				<AccordionTrigger class="py-3 text-xs">
					<div class="flex items-center gap-2">
						<Badge variant="secondary">건물</Badge>
						{buildingData?.name ?? '건물'} ({buildingEntity.id.split('-')[0]})
					</div>
				</AccordionTrigger>
				<AccordionContent class="pb-3">
					<div class="flex flex-col gap-2">
						<InputGroup>
							<InputGroupAddon>
								<InputGroupText>타일</InputGroupText>
							</InputGroupAddon>
							<InputGroupInput value={worldBuilding?.tile_x ?? 0} disabled />
							<InputGroupInput value={worldBuilding?.tile_y ?? 0} disabled />
						</InputGroup>
					</div>
				</AccordionContent>
			</AccordionItem>
		{:else if entity.type === 'item'}
			{@const itemEntity = entity as WorldItemEntity}
			{@const worldItem = $worldItemStore.data[itemEntity.id]}
			{@const itemData = worldItem ? $itemStore.data[worldItem.item_id] : undefined}
			<AccordionItem value={`item-${itemEntity.id}`}>
				<AccordionTrigger class="py-3 text-xs">
					<div class="flex items-center gap-2">
						<Badge variant="secondary">아이템</Badge>
						{itemData?.name ?? '아이템'} ({itemEntity.id.split('-')[0]})
					</div>
				</AccordionTrigger>
				<AccordionContent class="pb-3">
					<div class="flex flex-col gap-2">
						<InputGroup>
							<InputGroupAddon>
								<InputGroupText>좌표</InputGroupText>
							</InputGroupAddon>
							<InputGroupInput value={Math.round(itemEntity.x)} disabled />
							<InputGroupInput value={Math.round(itemEntity.y)} disabled />
						</InputGroup>
						<InputGroup>
							<InputGroupAddon>
								<InputGroupText>회전</InputGroupText>
							</InputGroupAddon>
							<InputGroupInput
								value={Math.round((itemEntity.angle * 180) / Math.PI)}
								disabled
							/>
							<InputGroupAddon align="inline-end">
								<InputGroupText>°</InputGroupText>
							</InputGroupAddon>
						</InputGroup>
					</div>
				</AccordionContent>
			</AccordionItem>
		{/if}
	{/each}
</Accordion>
