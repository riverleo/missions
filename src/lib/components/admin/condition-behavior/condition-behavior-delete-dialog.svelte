<script lang="ts">
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
	import { useBehavior } from '$lib/hooks/use-behavior';
	import { useCondition } from '$lib/hooks/use-condition';
	import type { ScenarioId } from '$lib/types';

	const { conditionBehaviorStore, conditionBehaviorDialogStore, closeConditionBehaviorDialog, admin } = useBehavior();
	const { conditionStore } = useCondition();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const behaviorId = $derived(
		$conditionBehaviorDialogStore?.type === 'delete' ? $conditionBehaviorDialogStore.conditionBehaviorId : undefined
	);
	const behavior = $derived(behaviorId ? $conditionBehaviorStore.data[behaviorId] : undefined);
	const condition = $derived(
		behavior?.condition_id ? $conditionStore.data[behavior.condition_id] : undefined
	);
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
				<Button type="button" variant="outline" onclick={() => closeConditionBehaviorDialog()}>취소</Button>
				<Button type="submit" variant="destructive" disabled={isSubmitting}>
					{isSubmitting ? '삭제 중...' : '삭제하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
