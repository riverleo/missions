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
	import { Checkbox } from '$lib/components/ui/checkbox';
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
	let selectedItemIds = $state<Set<ItemId>>(new Set());
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && building) {
			name = building.name ?? '';
			itemMaxCapacity =
				building.item_max_capacity === 0 ? '' : building.item_max_capacity.toString();
			selectedItemIds = new Set(buildingItems.map((bi) => bi.item_id));
		}
	});

	function toggleItem(itemId: ItemId, checked: boolean) {
		const newSet = new Set(selectedItemIds);
		if (checked) {
			newSet.add(itemId);
		} else {
			newSet.delete(itemId);
		}
		selectedItemIds = newSet;
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
			const toAdd = Array.from(selectedItemIds).filter((id) => !existingItemIds.has(id));
			const toRemove = buildingItems.filter((bi) => !selectedItemIds.has(bi.item_id));

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
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>아이템 저장 수</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput
						placeholder="숫자 입력"
						type="number"
						min="0"
						bind:value={itemMaxCapacity}
					/>
				</InputGroup>
				{#if items.length > 0}
					<div class="rounded-md border p-3">
						<div class="mb-2 text-sm font-medium">보관 가능한 아이템</div>
						<div class="flex flex-col gap-2">
							{#each items as item (item.id)}
								<label class="flex items-center gap-2">
									<Checkbox
										checked={selectedItemIds.has(item.id)}
										onCheckedChange={(checked) => toggleItem(item.id, checked === true)}
									/>
									<span class="text-sm">{item.name}</span>
								</label>
							{/each}
						</div>
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
