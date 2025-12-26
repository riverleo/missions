<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupText } from '$lib/components/ui/input-group';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { useConditionBehavior } from '$lib/hooks/use-condition-behavior';
	import { useCondition } from '$lib/hooks/use-condition';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useBuilding } from '$lib/hooks/use-building';
	import { alphabetical } from 'radash';
	import type { CharacterBehaviorType, ConditionId, CharacterId, BuildingId } from '$lib/types';
	import { getCharacterBehaviorTypeLabel } from '$lib/utils/state-label';

	const { conditionBehaviorStore, dialogStore, closeDialog, admin } = useConditionBehavior();
	const { conditionStore, buildingConditionStore } = useCondition();
	const { store: characterStore } = useCharacter();
	const { store: buildingStore } = useBuilding();

	const open = $derived($dialogStore?.type === 'update');
	const behaviorId = $derived(
		$dialogStore?.type === 'update' ? $dialogStore.conditionBehaviorId : undefined
	);
	const currentBehavior = $derived(
		behaviorId ? $conditionBehaviorStore.data[behaviorId] : undefined
	);
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
		if (open && currentBehavior) {
			buildingId = currentBehavior.building_id ?? undefined;
			conditionId = currentBehavior.condition_id;
			conditionThreshold = currentBehavior.condition_threshold;
			characterId = currentBehavior.character_id ?? undefined;
			behaviorType = currentBehavior.character_behavior_type;
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
		if (!behaviorId || !buildingId || !conditionId || isSubmitting) return;

		isSubmitting = true;

		admin
			.update(behaviorId, {
				building_id: buildingId as BuildingId,
				condition_id: conditionId as ConditionId,
				condition_threshold: conditionThreshold,
				character_id: characterId as CharacterId | undefined,
				character_behavior_type: behaviorType,
			})
			.then(() => {
				closeDialog();
			})
			.catch((error) => {
				console.error('Failed to update condition behavior:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>컨디션 행동 수정</DialogTitle>
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
						<ButtonGroupText>컨디션</ButtonGroupText>
						<Select
							type="single"
							value={conditionId ?? ''}
							onValueChange={onConditionChange}
							disabled={!buildingId || conditions.length === 0}
						>
							<SelectTrigger class="flex-1">
								{selectedConditionName}
							</SelectTrigger>
							<SelectContent>
								{#each conditions as condition (condition.id)}
									<SelectItem value={condition.id}>{condition.name}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</ButtonGroup>
				</ButtonGroup>
				<ButtonGroup class="w-full gap-2">
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
					<ButtonGroup class="flex-1">
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
				</ButtonGroup>
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>임계점</InputGroupText>
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
					{isSubmitting ? '수정 중...' : '수정하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
