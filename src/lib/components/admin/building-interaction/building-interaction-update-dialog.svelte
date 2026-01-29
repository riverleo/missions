<script lang="ts">
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
	import {
		getBuildingOnceInteractionTypeOptions,
		getBuildingRepeatInteractionTypeOptions,
	} from '$lib/utils/state-label';
	import { alphabetical } from 'radash';
	import type {
		BuildingId,
		CharacterId,
		OnceInteractionType,
		RepeatInteractionType,
	} from '$lib/types';

	const {
		buildingStore,
		buildingInteractionStore,
		buildingInteractionDialogStore,
		closeBuildingInteractionDialog,
		admin,
	} = useBuilding();
	const { characterStore } = useCharacter();

	const open = $derived($buildingInteractionDialogStore?.type === 'update');
	const buildingInteractionId = $derived(
		$buildingInteractionDialogStore?.type === 'update'
			? $buildingInteractionDialogStore.buildingInteractionId
			: undefined
	);
	const interaction = $derived(
		buildingInteractionId ? $buildingInteractionStore.data[buildingInteractionId] : undefined
	);

	const buildings = $derived(alphabetical(Object.values($buildingStore.data), (b) => b.name));
	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));

	let buildingId = $state<BuildingId | undefined>(undefined);
	let interactionType = $state<OnceInteractionType | RepeatInteractionType>('building_execute');
	let characterId = $state<CharacterId | undefined>(undefined);
	let isSubmitting = $state(false);

	const onceOptions = getBuildingOnceInteractionTypeOptions();
	const repeatOptions = getBuildingRepeatInteractionTypeOptions();
	const allOptions = [...onceOptions, ...repeatOptions];

	const selectedBuilding = $derived(buildings.find((b) => b.id === buildingId));
	const selectedBuildingName = $derived(
		buildingId === undefined ? '기본 (모든 건물)' : selectedBuilding?.name ?? '건물 선택'
	);
	const selectedCharacter = $derived(characters.find((c) => c.id === characterId));
	const selectedCharacterName = $derived(selectedCharacter?.name ?? '모두');
	const selectedInteractionLabel = $derived(
		allOptions.find((o) => o.value === interactionType)?.label ?? '사용'
	);

	// interaction이 변경될 때 폼 초기화
	$effect(() => {
		if (interaction) {
			buildingId = interaction.building_id || undefined;
			interactionType =
				(interaction.once_interaction_type as OnceInteractionType | null) ||
				(interaction.repeat_interaction_type as RepeatInteractionType | null) ||
				'building_execute';
			characterId = interaction.character_id || undefined;
		}
	});

	function onBuildingChange(value: string | undefined) {
		buildingId = (value as BuildingId) || undefined;
	}

	function onInteractionTypeChange(value: string | undefined) {
		if (value) {
			interactionType = value as OnceInteractionType | RepeatInteractionType;
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
			// Check if it's once or repeat type
			const isOnce = onceOptions.some((o) => o.value === interactionType);

			await admin.updateBuildingInteraction(buildingInteractionId, {
				building_id: buildingId || undefined,
				once_interaction_type: isOnce ? (interactionType as OnceInteractionType) : null,
				repeat_interaction_type: isOnce ? null : (interactionType as RepeatInteractionType),
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
							<SelectItem value="">기본 (모든 건물)</SelectItem>
							{#each buildings as building (building.id)}
								<SelectItem value={building.id}>{building.name}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</ButtonGroup>

				<ButtonGroup class="w-full">
					<ButtonGroupText>상호작용</ButtonGroupText>
					<Select type="single" value={interactionType} onValueChange={onInteractionTypeChange}>
						<SelectTrigger class="flex-1">
							{selectedInteractionLabel}
						</SelectTrigger>
						<SelectContent>
							{#each allOptions as option (option.value)}
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
				<Button type="submit" disabled={!buildingId || isSubmitting}>
					{isSubmitting ? '수정 중...' : '수정'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
