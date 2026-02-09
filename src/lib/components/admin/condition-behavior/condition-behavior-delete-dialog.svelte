<script lang="ts">
	import { useBehavior, useBuilding } from '$lib/hooks';
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

	const {
		conditionBehaviorDialogStore,
		closeConditionBehaviorDialog,
		getConditionBehavior,
		admin,
	} = useBehavior();
	const { getOrUndefinedCondition } = useBuilding();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const behaviorId = $derived(
		$conditionBehaviorDialogStore?.type === 'delete'
			? $conditionBehaviorDialogStore.conditionBehaviorId
			: undefined
	);
	const behavior = $derived(behaviorId ? getConditionBehavior(behaviorId) : undefined);
	const condition = $derived(getOrUndefinedCondition(behavior?.condition_id));
	const open = $derived($conditionBehaviorDialogStore?.type === 'delete');

	let isSubmitting = $state(false);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeConditionBehaviorDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!behaviorId || !scenarioId || isSubmitting) return;

		isSubmitting = true;

		admin
			.removeConditionBehavior(behaviorId)
			.then(() => {
				closeConditionBehaviorDialog();
				goto(`/admin/scenarios/${scenarioId}/condition-behaviors`);
			})
			.catch((error) => {
				console.error('Failed to delete condition behavior:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>컨디션 행동 삭제</DialogTitle>
			<DialogDescription>
				정말로 "{behavior?.name ?? ''}" 행동을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
			</DialogDescription>
		</DialogHeader>
		<form {onsubmit}>
			<DialogFooter>
				<Button type="button" variant="outline" onclick={() => closeConditionBehaviorDialog()}>
					취소
				</Button>
				<Button type="submit" variant="destructive" disabled={isSubmitting}>
					{isSubmitting ? getActionString('deleting') : getActionString('deleteAction')}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
