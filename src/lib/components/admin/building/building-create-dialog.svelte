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
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId } from '$lib/types';

	const { admin, buildingDialogStore, closeBuildingDialog } = useBuilding();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const open = $derived($buildingDialogStore?.type === 'create');

	let name = $state('');
	let itemMaxCapacity = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (open) {
			name = '';
			itemMaxCapacity = '';
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeBuildingDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim() || isSubmitting) return;

		isSubmitting = true;

		const capacity = parseInt(itemMaxCapacity) || 0;

		admin
			.createBuilding({
				name: name.trim(),
				item_max_capacity: capacity,
			})
			.then((building) => {
				closeBuildingDialog();
				goto(`/admin/scenarios/${scenarioId}/buildings/${building.id}`);
			})
			.catch((error) => {
				console.error('Failed to create building:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
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
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !name.trim()}>
					{isSubmitting ? '생성 중...' : '생성하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
