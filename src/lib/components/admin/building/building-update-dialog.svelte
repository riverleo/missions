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
	import { IconHeading } from '@tabler/icons-svelte';
	import { useBuilding } from '$lib/hooks/use-building';

	const { buildingStore, admin, buildingDialogStore, closeBuildingDialog } = useBuilding();

	const open = $derived($buildingDialogStore?.type === 'update');
	const buildingId = $derived(
		$buildingDialogStore?.type === 'update' ? $buildingDialogStore.buildingId : undefined
	);
	const building = $derived(buildingId ? $buildingStore.data[buildingId] : undefined);

	let name = $state('');
	let itemMaxCapacity = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && building) {
			name = building.name ?? '';
			itemMaxCapacity =
				building.item_max_capacity === 0 ? '' : building.item_max_capacity.toString();
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeBuildingDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!buildingId || !name.trim() || isSubmitting) return;

		isSubmitting = true;

		const capacity = parseInt(itemMaxCapacity) || 0;

		admin
			.updateBuilding(buildingId, {
				name: name.trim(),
				item_max_capacity: capacity,
			})
			.then(() => {
				closeBuildingDialog();
			})
			.catch((error) => {
				console.error('Failed to update building:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
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
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !name.trim()}>
					{isSubmitting ? '저장 중...' : '저장'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
