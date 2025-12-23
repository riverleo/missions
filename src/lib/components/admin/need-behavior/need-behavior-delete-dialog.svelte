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
	import { useNeedBehavior } from '$lib/hooks/use-need-behavior';
	import type { ScenarioId } from '$lib/types';

	const { needBehaviorStore, dialogStore, closeDialog, admin } = useNeedBehavior();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const behaviorId = $derived(
		$dialogStore?.type === 'delete' ? $dialogStore.behaviorId : undefined
	);
	const behavior = $derived(behaviorId ? $needBehaviorStore.data[behaviorId] : undefined);
	const open = $derived($dialogStore?.type === 'delete');

	let isSubmitting = $state(false);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!behaviorId || !scenarioId || isSubmitting) return;

		isSubmitting = true;

		admin
			.remove(behaviorId)
			.then(() => {
				closeDialog();
				goto(`/admin/scenarios/${scenarioId}/behaviors`);
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
				<Button type="button" variant="outline" onclick={() => closeDialog()}>취소</Button>
				<Button type="submit" variant="destructive" disabled={isSubmitting}>
					{isSubmitting ? '삭제 중...' : '삭제하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
