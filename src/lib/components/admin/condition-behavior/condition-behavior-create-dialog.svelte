<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupButton,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuRadioGroup,
		DropdownMenuRadioItem,
	} from '$lib/components/ui/dropdown-menu';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { IconChevronDown } from '@tabler/icons-svelte';
	import { useConditionBehavior } from '$lib/hooks/use-condition-behavior';
	import { useCondition } from '$lib/hooks/use-condition';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useBuilding } from '$lib/hooks/use-building';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { alphabetical } from 'radash';
	import type {
		CharacterBehaviorType,
		ConditionId,
		CharacterId,
		BuildingId,
		ScenarioId,
	} from '$lib/types';
	import { getCharacterBehaviorTypeLabel } from '$lib/utils/state-label';

	const { dialogStore, closeDialog, admin } = useConditionBehavior();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const { conditionStore, buildingConditionStore } = useCondition();
	const { store: characterStore } = useCharacter();
	const { store: buildingStore } = useBuilding();

	const open = $derived($dialogStore?.type === 'create');
	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));
	const buildings = $derived(alphabetical(Object.values($buildingStore.data), (b) => b.name));

	const behaviorTypes: CharacterBehaviorType[] = ['demolish', 'repair', 'clean'];

	let buildingId = $state<string | undefined>(undefined);
	let conditionId = $state<string | undefined>(undefined);
	let conditionThreshold = $state(0);
	let characterId = $state<string | undefined>(undefined);
	let behaviorType = $state<CharacterBehaviorType>('repair');
	let isSubmitting = $state(false);

	// 선택된 건물에 연결된 컨디션 ID 목록
	const availableConditionIds = $derived(
		buildingId
			? new Set(
					Object.values($buildingConditionStore.data)
						.filter((bc) => bc.building_id === buildingId)
						.map((bc) => bc.condition_id)
				)
			: new Set<string>()
	);

	// 필터링된 컨디션 목록 (건물 선택 시에만 표시)
	const conditions = $derived(
		buildingId
			? alphabetical(
					Object.values($conditionStore.data).filter((c) => availableConditionIds.has(c.id)),
					(c) => c.name
				)
			: []
	);

	const selectedBuilding = $derived(buildings.find((b) => b.id === buildingId));
	const selectedBuildingName = $derived(selectedBuilding?.name ?? '건물 선택');
	const selectedCondition = $derived(conditions.find((c) => c.id === conditionId));
	const selectedConditionName = $derived(selectedCondition?.name ?? '컨디션 선택');
	const selectedCharacter = $derived(characters.find((c) => c.id === characterId));
	const selectedCharacterName = $derived(selectedCharacter?.name ?? '모두');
	const selectedTypeName = $derived(getCharacterBehaviorTypeLabel(behaviorType));

	$effect(() => {
		if (open) {
			buildingId = undefined;
			conditionId = undefined;
			conditionThreshold = 0;
			characterId = undefined;
			behaviorType = 'repair';
		}
	});

	// buildingId 변경 시 conditionId 검증
	$effect(() => {
		if (buildingId && conditionId && !availableConditionIds.has(conditionId)) {
			conditionId = undefined;
		}
	});

	function onBuildingChange(value: string | undefined) {
		buildingId = value || undefined;
	}

	function onConditionChange(value: string) {
		conditionId = value || undefined;
	}

	function onCharacterChange(value: string | undefined) {
		characterId = value || undefined;
	}

	function onTypeChange(value: string | undefined) {
		if (value) {
			behaviorType = value as CharacterBehaviorType;
		}
	}

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!buildingId || !conditionId || isSubmitting) return;

		isSubmitting = true;

		admin
			.create({
				building_id: buildingId as BuildingId,
				condition_id: conditionId as ConditionId,
				condition_threshold: conditionThreshold,
				character_id: characterId as CharacterId | undefined,
				character_behavior_type: behaviorType,
			})
			.then((behavior) => {
				closeDialog();
				goto(`/admin/scenarios/${scenarioId}/condition-behaviors/${behavior.id}`);
			})
			.catch((error) => {
				console.error('Failed to create condition behavior:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>새로운 컨디션 행동 생성</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<ButtonGroup class="w-full gap-2">
					<ButtonGroup class="flex-1">
						<ButtonGroupText>건물</ButtonGroupText>
						<Select type="single" value={buildingId ?? ''} onValueChange={onBuildingChange}>
							<SelectTrigger class="flex-1">
								{selectedBuildingName}
							</SelectTrigger>
							<SelectContent>
								{#each buildings as building (building.id)}
									<SelectItem value={building.id}>{building.name}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</ButtonGroup>
					<ButtonGroup class="flex-1">
						<ButtonGroupText>행동</ButtonGroupText>
						<Select type="single" value={behaviorType} onValueChange={onTypeChange}>
							<SelectTrigger class="flex-1">
								{selectedTypeName}
							</SelectTrigger>
							<SelectContent>
								{#each behaviorTypes as type (type)}
									<SelectItem value={type}>
										{getCharacterBehaviorTypeLabel(type)}
									</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</ButtonGroup>
				</ButtonGroup>
				<ButtonGroup class="w-full">
					<ButtonGroupText>캐릭터</ButtonGroupText>
					<Select type="single" value={characterId ?? ''} onValueChange={onCharacterChange}>
						<SelectTrigger class="flex-1">
							{selectedCharacterName}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">모두</SelectItem>
							{#each characters as character (character.id)}
								<SelectItem value={character.id}>{character.name}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</ButtonGroup>
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<DropdownMenu>
							<DropdownMenuTrigger>
								{#snippet child({ props })}
									<InputGroupButton
										{...props}
										variant="ghost"
										disabled={!buildingId || conditions.length === 0}
									>
										{selectedConditionName}
										<IconChevronDown class="ml-1 size-4" />
									</InputGroupButton>
								{/snippet}
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start">
								{#if conditions.length === 0}
									<div class="p-2 text-center text-sm text-muted-foreground">
										선택 가능한 항목 없음
									</div>
								{:else}
									<DropdownMenuRadioGroup
										value={conditionId ?? ''}
										onValueChange={onConditionChange}
									>
										{#each conditions as condition (condition.id)}
											<DropdownMenuRadioItem value={condition.id}>
												{condition.name}
											</DropdownMenuRadioItem>
										{/each}
									</DropdownMenuRadioGroup>
								{/if}
							</DropdownMenuContent>
						</DropdownMenu>
					</InputGroupAddon>
					<InputGroupInput
						type="number"
						placeholder="0"
						step="1"
						min="0"
						max={selectedCondition?.max_value ?? 100}
						bind:value={conditionThreshold}
					/>
					<InputGroupAddon align="inline-end">
						<InputGroupText>/ {selectedCondition?.max_value ?? 100} 이하</InputGroupText>
					</InputGroupAddon>
				</InputGroup>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !buildingId || !conditionId}>
					{isSubmitting ? '생성 중...' : '생성하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
