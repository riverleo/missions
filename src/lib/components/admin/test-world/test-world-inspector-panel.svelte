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
	const { worldCharacterStore, worldBuildingStore } = useWorld();
	const { store: characterStore } = useCharacter();
	const { store: buildingStore } = useBuilding();

	// TODO: 틱 시스템 구현 후 실제 틱 데이터 연결
	const currentTick = $derived(0);

	// 월드의 캐릭터와 건물 목록
	const worldCharacters = $derived(
		Object.values($worldCharacterStore.data).filter((c) => c.world_id === TEST_WORLD_ID)
	);
	const worldBuildings = $derived(
		Object.values($worldBuildingStore.data).filter((b) => b.world_id === TEST_WORLD_ID)
	);

	function onResetTick() {
		// TODO: 틱 초기화 로직
		console.log('Reset tick');
	}
</script>

<Accordion type="single" value="world" class="px-3 py-1">
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

	{#each worldCharacters as character, index (character.id)}
		{@const characterData = $characterStore.data[character.character_id]}
		<AccordionItem value={`character-${character.id}`}>
			<AccordionTrigger class="py-3 text-xs">
				{characterData?.name ?? '캐릭터'} ({character.id.split('-')[0]})
			</AccordionTrigger>
			<AccordionContent class="pb-3">
				<div class="flex flex-col gap-2">
					<InputGroup>
						<InputGroupAddon>
							<InputGroupText>ID</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput value={character.character_id} disabled />
					</InputGroup>
					<InputGroup>
						<InputGroupAddon>
							<InputGroupText>위치</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput
							value={`(${Math.round(character.x)}, ${Math.round(character.y)})`}
							disabled
						/>
					</InputGroup>
				</div>
			</AccordionContent>
		</AccordionItem>
	{/each}

	{#each worldBuildings as building, index (building.id)}
		{@const buildingData = $buildingStore.data[building.building_id]}
		<AccordionItem value={`building-${building.id}`}>
			<AccordionTrigger class="py-3 text-xs">
				{buildingData?.name ?? '건물'} ({building.id.split('-')[0]})
			</AccordionTrigger>
			<AccordionContent class="pb-3">
				<div class="flex flex-col gap-2">
					<InputGroup>
						<InputGroupAddon>
							<InputGroupText>ID</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput value={building.building_id} disabled />
					</InputGroup>
					<InputGroup>
						<InputGroupAddon>
							<InputGroupText>타일</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput value={`(${building.tile_x}, ${building.tile_y})`} disabled />
					</InputGroup>
				</div>
			</AccordionContent>
		</AccordionItem>
	{/each}
</Accordion>
