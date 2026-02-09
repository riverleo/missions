<script lang="ts">
	import { useBehavior } from '$lib/hooks';
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

	const { needBehaviorDialogStore, closeNeedBehaviorDialog, getNeedBehavior, admin } =
		useBehavior();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const needBehaviorId = $derived(
		$needBehaviorDialogStore?.type === 'delete'
			? $needBehaviorDialogStore.needBehaviorId
			: undefined
	);
	const behavior = $derived(needBehaviorId ? getNeedBehavior(needBehaviorId) : undefined);
	const open = $derived($needBehaviorDialogStore?.type === 'delete');

	let isSubmitting = $state(false);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeNeedBehaviorDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!needBehaviorId || !scenarioId || isSubmitting) return;

		isSubmitting = true;

		admin
			.removeNeedBehavior(needBehaviorId)
			.then(() => {
				closeNeedBehaviorDialog();
				goto(`/admin/scenarios/${scenarioId}/need-behaviors`);
			})
			.catch((error) => {
				console.error('Failed to delete behavior:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>행동 삭제</DialogTitle>
			<DialogDescription>
				정말로 "{behavior?.name}" 행동을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
			</DialogDescription>
		</DialogHeader>
		<form {onsubmit}>
			<DialogFooter>
				<Button type="button" variant="outline" onclick={() => closeNeedBehaviorDialog()}>
					취소
				</Button>
				<Button type="submit" variant="destructive" disabled={isSubmitting}>
					{isSubmitting ? getActionString('deleting') : getActionString('deleteAction')}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
