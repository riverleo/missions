<script lang="ts">
	import { useWorldTest, useWorld, TEST_WORLD_ID } from '$lib/hooks/use-world';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useBuilding } from '$lib/hooks/use-building';
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

	const { store } = useWorldTest();
	const { worldCharacterStore, worldBuildingStore, selectedEntityStore, setSelectedEntityId } =
		useWorld();
	const { store: characterStore } = useCharacter();
	const { store: buildingStore } = useBuilding();

	// TODO: 틱 시스템 구현 후 실제 틱 데이터 연결
	const currentTick = $derived(0);

	// 월드의 캐릭터와 건물을 하나의 배열로 합쳐서 엔티티로 표시
	const worldCharacters = $derived(
		Object.values($worldCharacterStore.data).filter((c) => c.world_id === TEST_WORLD_ID)
	);
	const worldBuildings = $derived(
		Object.values($worldBuildingStore.data).filter((b) => b.world_id === TEST_WORLD_ID)
	);

	// 캐릭터와 건물을 type 정보와 함께 합치기
	const entities = $derived([
		...worldCharacters.map((c) => ({ type: 'character' as const, data: c })),
		...worldBuildings.map((b) => ({ type: 'building' as const, data: b })),
	]);

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

	{#each entities as entity (entity.data.id)}
		{#if entity.type === 'character'}
			{@const character = entity.data}
			{@const characterData = $characterStore.data[character.character_id]}
			<AccordionItem value={`character-${character.id}`}>
				<AccordionTrigger class="py-3 text-xs">
					{characterData?.name ?? '캐릭터'} ({character.id.split('-')[0]})
				</AccordionTrigger>
				<AccordionContent class="pb-3">
					<div class="flex flex-col gap-2">
						<InputGroup>
							<InputGroupAddon>
								<InputGroupText>좌표</InputGroupText>
							</InputGroupAddon>
							<InputGroupInput value={character.x} disabled />
							<InputGroupInput value={character.y} disabled />
						</InputGroup>
					</div>
				</AccordionContent>
			</AccordionItem>
		{:else if entity.type === 'building'}
			{@const building = entity.data}
			{@const buildingData = $buildingStore.data[building.building_id]}
			<AccordionItem value={`building-${building.id}`}>
				<AccordionTrigger class="py-3 text-xs">
					{buildingData?.name ?? '건물'} ({building.id.split('-')[0]})
				</AccordionTrigger>
				<AccordionContent class="pb-3">
					<div class="flex flex-col gap-2">
						<InputGroup>
							<InputGroupAddon>
								<InputGroupText>타일</InputGroupText>
							</InputGroupAddon>
							<InputGroupInput value={building.tile_x} disabled />
							<InputGroupInput value={building.tile_y} disabled />
						</InputGroup>
					</div>
				</AccordionContent>
			</AccordionItem>
		{/if}
	{/each}
</Accordion>
