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
	import { IconHeading, IconBox } from '@tabler/icons-svelte';
	import { useBuilding } from '$lib/hooks/use-building';

	const { store, admin, dialogStore, closeDialog } = useBuilding();

	const open = $derived($dialogStore?.type === 'update');
	const buildingId = $derived(
		$dialogStore?.type === 'update' ? $dialogStore.buildingId : undefined
	);
	const building = $derived(buildingId ? $store.data[buildingId] : undefined);

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
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!buildingId || !name.trim() || isSubmitting) return;

		isSubmitting = true;

		const capacity = parseInt(itemMaxCapacity) || 0;

		admin
			.update(buildingId, {
				name: name.trim(),
				item_max_capacity: capacity,
			})
			.then(() => {
				closeDialog();
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
						<InputGroupText>
							<IconBox />
						</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput
						placeholder="아이템 최대 소지 개수"
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
