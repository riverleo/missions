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
	import { useBuilding } from '$lib/hooks/use-building';
	import { useItem } from '$lib/hooks/use-item';
	import type { ItemId, ScenarioId } from '$lib/types';
	import { page } from '$app/state';

	const { buildingStore, buildingItemStore, admin, buildingDialogStore, closeBuildingDialog } =
		useBuilding();
	const { itemStore } = useItem();

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const open = $derived($buildingDialogStore?.type === 'update');
	const buildingId = $derived(
		$buildingDialogStore?.type === 'update' ? $buildingDialogStore.buildingId : undefined
	);
	const building = $derived(buildingId ? $buildingStore.data[buildingId] : undefined);
	const items = $derived(Object.values($itemStore.data));
	const buildingItems = $derived(
		Object.values($buildingItemStore.data).filter((bi) => bi.building_id === buildingId)
	);

	let name = $state('');
	let itemMaxCapacity = $state('');
	let selectedItemIds = $state<ItemId[]>([]);
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && building) {
			name = building.name ?? '';
			itemMaxCapacity =
				building.item_max_capacity === 0 ? '' : building.item_max_capacity.toString();
			selectedItemIds = buildingItems.map((bi) => bi.item_id);
		}
	});

	function onItemsChange(value: string[] | undefined) {
		selectedItemIds = (value ?? []) as ItemId[];
	}

	function onOpenChange(value: boolean) {
		if (!value) {
			closeBuildingDialog();
		}
	}

	async function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!buildingId || !name.trim() || isSubmitting) return;

		isSubmitting = true;

		const capacity = parseInt(itemMaxCapacity) || 0;

		try {
			await admin.updateBuilding(buildingId, {
				name: name.trim(),
				item_max_capacity: capacity,
			});

			// Calculate changes to building_items
			const existingItemIds = new Set(buildingItems.map((bi) => bi.item_id));
			const selectedItemIdsSet = new Set(selectedItemIds);
			const toAdd = selectedItemIds.filter((id) => !existingItemIds.has(id));
			const toRemove = buildingItems.filter((bi) => !selectedItemIdsSet.has(bi.item_id));

			// Add new building_items
			await Promise.all(
				toAdd.map((itemId) =>
					admin.createBuildingItem(scenarioId, {
						building_id: buildingId,
						item_id: itemId,
					})
				)
			);

			// Remove deselected building_items
			await Promise.all(toRemove.map((bi) => admin.removeBuildingItem(bi.id)));

			closeBuildingDialog();
		} catch (error) {
			console.error('Failed to update building:', error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>건물 수정</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>
							<IconHeading />
						</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput placeholder="건물 이름" bind:value={name} />
				</InputGroup>
				{#if items.length > 0}
					<div class="flex gap-2">
						<ButtonGroup class="flex-1">
							<ButtonGroupText>아이템 선택</ButtonGroupText>
							<Select type="multiple" value={selectedItemIds} onValueChange={onItemsChange}>
								<SelectTrigger class="flex-1">
									{selectedItemIds.length > 0
										? `${selectedItemIds.length}개 선택됨`
										: '아이템을 선택하세요'}
								</SelectTrigger>
								<SelectContent>
									{#each items as item (item.id)}
										<SelectItem value={item.id}>{item.name}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</ButtonGroup>
						<InputGroup class="w-32">
							<InputGroupAddon align="inline-start">
								<InputGroupText>최대</InputGroupText>
							</InputGroupAddon>
							<InputGroupInput placeholder="0" type="number" min="0" bind:value={itemMaxCapacity} />
						</InputGroup>
					</div>
				{/if}
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !name.trim()}>
					{isSubmitting ? '저장 중...' : '저장'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
