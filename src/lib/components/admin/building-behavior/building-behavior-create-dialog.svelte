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
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { IconHeading } from '@tabler/icons-svelte';
	import { useBuildingBehavior } from '$lib/hooks/use-building-behavior';
	import { useBuilding } from '$lib/hooks/use-building';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { alphabetical } from 'radash';
	import type { BuildingBehaviorType } from '$lib/types';
	import { getBuildingBehaviorTypeLabel } from '$lib/utils/state-label';

	const { dialogStore, closeDialog, admin } = useBuildingBehavior();
	const scenarioId = $derived(page.params.scenarioId);
	const { store: buildingStore } = useBuilding();

	const open = $derived($dialogStore?.type === 'create');
	const buildings = $derived(alphabetical(Object.values($buildingStore.data), (b) => b.name));

	const behaviorTypes: BuildingBehaviorType[] = ['demolish', 'use', 'repair', 'refill'];

	let description = $state('');
	let buildingId = $state<string | undefined>(undefined);
	let behaviorType = $state<BuildingBehaviorType>('use');
	let isSubmitting = $state(false);

	const selectedBuilding = $derived(buildings.find((b) => b.id === buildingId));
	const selectedBuildingName = $derived(selectedBuilding?.name ?? '건물 선택');
	const selectedTypeName = $derived(getBuildingBehaviorTypeLabel(behaviorType));

	$effect(() => {
		if (open) {
			description = '';
			buildingId = undefined;
			behaviorType = 'use';
		}
	});

	function onBuildingChange(value: string | undefined) {
		buildingId = value || undefined;
	}

	function onTypeChange(value: string | undefined) {
		if (value) {
			behaviorType = value as BuildingBehaviorType;
		}
	}

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!buildingId || isSubmitting) return;

		isSubmitting = true;

		admin
			.create({
				description: description.trim(),
				building_id: buildingId,
				type: behaviorType,
			})
			.then((behavior) => {
				closeDialog();
				goto(`/admin/scenarios/${scenarioId}/building-behaviors/${behavior.id}`);
			})
			.catch((error) => {
				console.error('Failed to create building behavior:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>새로운 건물 행동 생성</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
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
										{getBuildingBehaviorTypeLabel(type)}
									</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</ButtonGroup>
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
				</ButtonGroup>
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>
							<IconHeading />
						</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput placeholder="설명" bind:value={description} />
				</InputGroup>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !buildingId}>
					{isSubmitting ? '생성 중...' : '생성하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
