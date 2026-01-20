<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useCharacter } from '$lib/hooks/use-character';
	import { alphabetical } from 'radash';
	import type { BuildingId, CharacterId, CharacterBehaviorType, ScenarioId } from '$lib/types';

	const { store, interactionDialogStore, closeInteractionDialog, admin } = useBuilding();
	const { store: characterStore } = useCharacter();

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const open = $derived($interactionDialogStore?.type === 'create');

	const buildings = $derived(alphabetical(Object.values($store.data), (b) => b.name));
	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));

	let buildingId = $state<string>('');
	let characterBehaviorType = $state<CharacterBehaviorType>('use');
	let characterId = $state<string>('');
	let isSubmitting = $state(false);

	const behaviorTypeOptions: { value: CharacterBehaviorType; label: string }[] = [
		{ value: 'demolish', label: '철거' },
		{ value: 'use', label: '사용' },
		{ value: 'repair', label: '수리' },
		{ value: 'clean', label: '청소' },
		{ value: 'pick', label: '줍기' },
	];

	const selectedBuilding = $derived(buildings.find((b) => b.id === buildingId));
	const selectedBuildingName = $derived(selectedBuilding?.name ?? '건물 선택');
	const selectedCharacter = $derived(characters.find((c) => c.id === characterId));
	const selectedCharacterName = $derived(selectedCharacter?.name ?? '모두');
	const selectedBehaviorLabel = $derived(
		behaviorTypeOptions.find((o) => o.value === characterBehaviorType)?.label ?? '사용'
	);

	function onBuildingChange(value: string | undefined) {
		buildingId = value || '';
	}

	function onBehaviorTypeChange(value: string | undefined) {
		if (value) {
			characterBehaviorType = value as CharacterBehaviorType;
		}
	}

	function onCharacterChange(value: string | undefined) {
		characterId = value || '';
	}

	function onOpenChange(value: boolean) {
		if (!value) {
			closeInteractionDialog();
		}
	}

	async function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!buildingId || isSubmitting) return;

		isSubmitting = true;

		try {
			const interaction = await admin.createInteraction({
				building_id: buildingId as BuildingId,
				character_behavior_type: characterBehaviorType,
				character_id: characterId ? (characterId as CharacterId) : null,
			});

			closeInteractionDialog();
			goto(`/admin/scenarios/${scenarioId}/building-interactions/${interaction.id}`);
		} catch (error) {
			console.error('Failed to create interaction:', error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>건물 상호작용 생성</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<ButtonGroup class="w-full">
					<ButtonGroupText>건물</ButtonGroupText>
					<Select type="single" value={buildingId} onValueChange={onBuildingChange}>
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

				<ButtonGroup class="w-full">
					<ButtonGroupText>캐릭터</ButtonGroupText>
					<Select type="single" value={characterId} onValueChange={onCharacterChange}>
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
					<ButtonGroupText>행동</ButtonGroupText>
					<Select type="single" value={characterBehaviorType} onValueChange={onBehaviorTypeChange}>
						<SelectTrigger class="flex-1">
							{selectedBehaviorLabel}
						</SelectTrigger>
						<SelectContent>
							{#each behaviorTypeOptions as option (option.value)}
								<SelectItem value={option.value}>{option.label}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</ButtonGroup>
			</div>

			<DialogFooter>
				<Button type="submit" disabled={!buildingId || isSubmitting}>
					{isSubmitting ? '생성 중...' : '생성'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
