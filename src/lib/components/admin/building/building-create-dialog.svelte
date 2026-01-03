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
	import { IconBuilding, IconHeading } from '@tabler/icons-svelte';
	import { useBuilding } from '$lib/hooks/use-building';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId } from '$lib/types';

	const { admin, dialogStore, closeDialog } = useBuilding();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const open = $derived($dialogStore?.type === 'create');

	let name = $state('');
	let scale = $state<number>(1.0);
	let isSubmitting = $state(false);

	$effect(() => {
		if (open) {
			name = '';
			scale = 1.0;
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.create({ name: name.trim(), scale })
			.then((building) => {
				closeDialog();
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
		<form {onsubmit} class="space-y-4">
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<InputGroupText><IconHeading /></InputGroupText>
				</InputGroupAddon>
				<InputGroupInput placeholder="이름" bind:value={name} />
			</InputGroup>
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<InputGroupText>스케일</InputGroupText>
				</InputGroupAddon>
				<InputGroupInput
					type="number"
					step="0.01"
					min="0"
					bind:value={scale}
				/>
				<InputGroupAddon align="inline-end">
					<InputGroupText>배</InputGroupText>
				</InputGroupAddon>
			</InputGroup>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '생성 중...' : '생성하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
