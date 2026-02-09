<script lang="ts">
	import { useBuilding } from '$lib/hooks';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId } from '$lib/types';
	import { getActionString } from '$lib/utils/label';

	const { conditionDialogStore, closeConditionDialog, getOrUndefinedCondition, admin } = useBuilding();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const conditionId = $derived(
		$conditionDialogStore?.type === 'delete' ? $conditionDialogStore.conditionId : undefined
	);
	const condition = $derived(getOrUndefinedCondition(conditionId));
	const open = $derived($conditionDialogStore?.type === 'delete');

	let isSubmitting = $state(false);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeConditionDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!conditionId || !scenarioId || isSubmitting) return;

		isSubmitting = true;

		admin
			.removeCondition(conditionId)
			.then(() => {
				closeConditionDialog();
				goto(`/admin/scenarios/${scenarioId}/conditions`);
			})
			.catch((error) => {
				console.error('Failed to delete condition:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>컨디션 삭제</DialogTitle>
			<DialogDescription>
				정말로 "{condition?.name}" 컨디션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
			</DialogDescription>
		</DialogHeader>
		<form {onsubmit}>
			<DialogFooter>
				<Button type="button" variant="outline" onclick={() => closeConditionDialog()}>{getActionString("cancel")}</Button>
				<Button type="submit" variant="destructive" disabled={isSubmitting}>
					{isSubmitting ? getActionString('deleting') : getActionString('deleteAction')}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
