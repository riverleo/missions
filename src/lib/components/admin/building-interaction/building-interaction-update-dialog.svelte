<script lang="ts">
	import { useBuilding, useCharacter, useInteraction } from '$lib/hooks';
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
	import {
		getBehaviorInteractionTypeLabels,
		isOnceInteractionType,
		isFulfillInteractionType,
		isSystemInteractionType,
	} from '$lib/utils/label';
	import { alphabetical } from 'radash';
	import type {
		BuildingId,
		CharacterId,
		OnceInteractionType,
		FulfillInteractionType,
		SystemInteractionType,
		BehaviorInteractionType,
	} from '$lib/types';
	import { getFallbackString, getActionString } from '$lib/utils/label';

	const { buildingStore } = useBuilding();
	const { characterStore } = useCharacter();
	const {
		buildingInteractionDialogStore,
		closeBuildingInteractionDialog,
		getBuildingInteraction,
		admin,
	} = useInteraction();

	const open = $derived($buildingInteractionDialogStore?.type === 'update');
	const buildingInteractionId = $derived(
		$buildingInteractionDialogStore?.type === 'update'
			? $buildingInteractionDialogStore.buildingInteractionId
			: undefined
	);
	const interaction = $derived(
		buildingInteractionId ? getBuildingInteraction(buildingInteractionId) : undefined
	);

	const buildings = $derived(alphabetical(Object.values($buildingStore.data), (b) => b.name));
	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));

	let buildingId = $state<BuildingId | undefined>(undefined);
	let behaviorInteractionType = $state<BehaviorInteractionType>('building_use');
	let characterId = $state<CharacterId | undefined>(undefined);
	let isSubmitting = $state(false);

	const interactionTypeOptions = getBehaviorInteractionTypeLabels('building');

	const selectedBuilding = $derived(buildings.find((b) => b.id === buildingId));
	const selectedBuildingName = $derived(selectedBuilding?.name ?? '건물 선택');
	const selectedCharacter = $derived(characters.find((c) => c.id === characterId));
	const selectedCharacterName = $derived(selectedCharacter?.name ?? getFallbackString('all'));
	const selectedInteractionLabel = $derived(
		interactionTypeOptions.find((o) => o.value === behaviorInteractionType)?.label ?? '사용'
	);

	// interaction이 변경될 때 폼 초기화
	$effect(() => {
		if (interaction) {
			buildingId = interaction.building_id || undefined;
			behaviorInteractionType =
				(interaction.once_interaction_type as OnceInteractionType | null) ||
				(interaction.fulfill_interaction_type as FulfillInteractionType | null) ||
				(interaction.system_interaction_type as SystemInteractionType | null) ||
				'building_use';
			characterId = interaction.character_id || undefined;
		}
	});

	function onBuildingChange(value: string | undefined) {
		buildingId = (value as BuildingId) || undefined;
	}

	function onInteractionTypeChange(value: string | undefined) {
		if (value) {
			behaviorInteractionType = value as
				| OnceInteractionType
				| FulfillInteractionType
				| SystemInteractionType;
		}
	}

	function onCharacterChange(value: string | undefined) {
		characterId = (value as CharacterId) || undefined;
	}

	function onOpenChange(value: boolean) {
		if (!value) {
			closeBuildingInteractionDialog();
		}
	}

	async function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!buildingInteractionId || !buildingId || isSubmitting) return;

		isSubmitting = true;

		try {
			await admin.updateBuildingInteraction(buildingInteractionId, {
				building_id: buildingId,
				once_interaction_type: isOnceInteractionType(behaviorInteractionType)
					? behaviorInteractionType
					: null,
				fulfill_interaction_type: isFulfillInteractionType(behaviorInteractionType)
					? behaviorInteractionType
					: null,
				system_interaction_type: isSystemInteractionType(behaviorInteractionType)
					? behaviorInteractionType
					: null,
				character_id: characterId || undefined,
			});

			closeBuildingInteractionDialog();
		} catch (error) {
			console.error('Failed to update interaction:', error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>건물 상호작용 수정</DialogTitle>
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
					<ButtonGroupText>상호작용</ButtonGroupText>
					<Select
						type="single"
						value={behaviorInteractionType}
						onValueChange={onInteractionTypeChange}
					>
						<SelectTrigger class="flex-1">
							{selectedInteractionLabel}
						</SelectTrigger>
						<SelectContent>
							{#each interactionTypeOptions as option (option.value)}
								<SelectItem value={option.value}>{option.label}</SelectItem>
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
				</ButtonGroup>
			</div>

			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !buildingId}>
					{isSubmitting ? '수정 중...' : '수정'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
