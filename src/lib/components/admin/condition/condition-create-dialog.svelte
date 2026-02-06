<script lang="ts">
	import { useBuilding } from '$lib/hooks';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import { InputGroup, InputGroupInput, InputGroupAddon } from '$lib/components/ui/input-group';
	import { IconHeading } from '@tabler/icons-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId } from '$lib/types';
	import { getActionString } from '$lib/utils/state-label';

	const { conditionDialogStore, closeConditionDialog, admin } = useBuilding();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const open = $derived($conditionDialogStore?.type === 'create');

	let name = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (open) {
			name = '';
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeConditionDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.createCondition(scenarioId, { name: name.trim() })
			.then((condition) => {
				closeConditionDialog();
				goto(`/admin/scenarios/${scenarioId}/conditions/${condition.id}`);
			})
			.catch((error) => {
				console.error('Failed to create condition:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>새로운 컨디션 생성</DialogTitle>
		</DialogHeader>
		<form {onsubmit}>
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<IconHeading class="size-4" />
				</InputGroupAddon>
				<InputGroupInput placeholder="이름" bind:value={name} />
			</InputGroup>
			<DialogFooter class="mt-4">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? getActionString('creating') : getActionString('createAction')}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
