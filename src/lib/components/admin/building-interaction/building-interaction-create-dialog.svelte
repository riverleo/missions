<script lang="ts">
	import { useBuilding, useCharacter, useInteraction } from '$lib/hooks';
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
	import {
		getBuildingOnceInteractionTypeOptions,
		getBuildingFulfillInteractionTypeOptions,
		getBuildingSystemInteractionTypeOptions,
	} from '$lib/utils/state-label';
	import { alphabetical } from 'radash';
	import type {
		BuildingId,
		CharacterId,
		OnceInteractionType,
		FulfillInteractionType,
		SystemInteractionType,
		ScenarioId,
	} from '$lib/types';

	const { buildingStore } = useBuilding();
	const { characterStore } = useCharacter();
	const {
		buildingInteractionDialogStore: buildingInteractionDialogStore,
		closeBuildingInteractionDialog,
		admin,
	} = useInteraction();

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const open = $derived($buildingInteractionDialogStore?.type === 'create');

	const buildings = $derived(alphabetical(Object.values($buildingStore.data), (b) => b.name));
	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));

	let buildingId = $state<BuildingId | undefined>(undefined);
	let interactionType = $state<OnceInteractionType | FulfillInteractionType | SystemInteractionType>('building_use');
	let characterId = $state<CharacterId | undefined>(undefined);
	let isSubmitting = $state(false);

	const onceOptions = getBuildingOnceInteractionTypeOptions();
	const fulfillOptions = getBuildingFulfillInteractionTypeOptions();
	const systemOptions = getBuildingSystemInteractionTypeOptions();
	const allOptions = [...onceOptions, ...fulfillOptions, ...systemOptions];

	const selectedBuilding = $derived(buildings.find((b) => b.id === buildingId));
	const selectedBuildingName = $derived(selectedBuilding?.name ?? '건물 선택');
	const selectedCharacter = $derived(characters.find((c) => c.id === characterId));
	const selectedCharacterName = $derived(selectedCharacter?.name ?? '모두');
	const selectedInteractionLabel = $derived(
		allOptions.find((o) => o.value === interactionType)?.label ?? '사용'
	);

	function onBuildingChange(value: string | undefined) {
		buildingId = (value as BuildingId) || undefined;
	}

	function onInteractionTypeChange(value: string | undefined) {
		if (value) {
			interactionType = value as OnceInteractionType | FulfillInteractionType | SystemInteractionType;
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
		if (isSubmitting) return;
		if (!buildingId) return;

		isSubmitting = true;

		try {
			// Determine interaction type
			const isOnce = onceOptions.some((o) => o.value === interactionType);
			const isFulfill = fulfillOptions.some((o) => o.value === interactionType);
			const isSystem = systemOptions.some((o) => o.value === interactionType);

			const interaction = await admin.createBuildingInteraction(scenarioId, {
				building_id: buildingId,
				once_interaction_type: isOnce ? (interactionType as OnceInteractionType) : null,
				fulfill_interaction_type: isFulfill ? (interactionType as FulfillInteractionType) : null,
				system_interaction_type: isSystem ? (interactionType as SystemInteractionType) : null,
				character_id: characterId || null,
			});

			closeBuildingInteractionDialog();
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
				<Button type="submit" disabled={isSubmitting || !buildingId}>
					{isSubmitting ? '생성 중...' : '생성'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
