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
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuTrigger,
	} from '$lib/components/ui/dropdown-menu';
	import { IconHeading, IconChevronDown } from '@tabler/icons-svelte';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useItem } from '$lib/hooks/use-item';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId, ItemId, BuildingId } from '$lib/types';

	const { admin, buildingDialogStore, closeBuildingDialog } = useBuilding();
	const { itemStore } = useItem();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const items = $derived(Object.values($itemStore.data));

	const open = $derived($buildingDialogStore?.type === 'create');

	let name = $state('');
	let itemMaxCapacity = $state('');
	let selectedItemIds = $state<Set<ItemId>>(new Set());
	let isSubmitting = $state(false);

	$effect(() => {
		if (open) {
			name = '';
			itemMaxCapacity = '';
			selectedItemIds = new Set();
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
		if (!name.trim() || isSubmitting) return;

		isSubmitting = true;

		const capacity = parseInt(itemMaxCapacity) || 0;

		try {
			const building = await admin.createBuilding(scenarioId, {
				name: name.trim(),
				item_max_capacity: capacity,
			});

			// Create building_items for selected items
			await Promise.all(
				Array.from(selectedItemIds).map((itemId) =>
					admin.createBuildingItem(scenarioId, {
						building_id: building.id,
						item_id: itemId,
					})
				)
			);

			closeBuildingDialog();
			goto(`/admin/scenarios/${scenarioId}/buildings/${building.id}`);
		} catch (error) {
			console.error('Failed to create building:', error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>새로운 건물 생성</DialogTitle>
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
					<ButtonGroup class="w-full">
						<ButtonGroupText>아이템 선택</ButtonGroupText>
						<DropdownMenu>
							<DropdownMenuTrigger
								class="flex h-9 flex-1 items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm"
							>
								<span>
									{selectedItemIds.size > 0
										? `${selectedItemIds.size}개 선택됨`
										: '아이템을 선택하세요'}
								</span>
								<IconChevronDown class="size-4" />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" class="w-56 max-h-64 overflow-y-auto">
								<div class="p-2 space-y-2">
									{#each items as item (item.id)}
										<label class="flex items-center gap-2 cursor-pointer">
											<Checkbox
												checked={selectedItemIds.has(item.id)}
												onCheckedChange={(checked) => toggleItem(item.id, checked === true)}
											/>
											<span class="text-sm">{item.name}</span>
										</label>
									{/each}
								</div>
							</DropdownMenuContent>
						</DropdownMenu>
					</ButtonGroup>
				{/if}
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !name.trim()}>
					{isSubmitting ? '생성 중...' : '생성하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
