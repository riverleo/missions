<script lang="ts">
	import { useBuilding, useItem } from '$lib/hooks';
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
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId, ItemId } from '$lib/types';

	const { admin, buildingDialogStore, closeBuildingDialog } = useBuilding();
	const { itemStore } = useItem();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const items = $derived(Object.values($itemStore.data));

	const open = $derived($buildingDialogStore?.type === 'create');

	let name = $state('');
	let itemMaxCapacity = $state('');
	let selectedItemIds = $state<ItemId[]>([]);
	let isSubmitting = $state(false);

	$effect(() => {
		if (open) {
			name = '';
			itemMaxCapacity = '';
			selectedItemIds = [];
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
				selectedItemIds.map((itemId) =>
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
				{#if items.length > 0}
					<div class="flex gap-2">
						<ButtonGroup>
							<Select type="multiple" value={selectedItemIds} onValueChange={onItemsChange}>
								<SelectTrigger class="w-32">
									{selectedItemIds.length > 0
										? `${selectedItemIds.length}개 선택됨`
										: '보관 아이템'}
								</SelectTrigger>
								<SelectContent>
									{#each items as item (item.id)}
										<SelectItem value={item.id}>{item.name}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</ButtonGroup>
						<InputGroup class="flex-1">
							<InputGroupInput placeholder="0" type="number" min="0" bind:value={itemMaxCapacity} />
							<InputGroupAddon align="inline-end">
								<InputGroupText>개 / 최대</InputGroupText>
							</InputGroupAddon>
						</InputGroup>
					</div>
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
