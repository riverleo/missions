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
	import { useBuildingBehavior } from '$lib/hooks/use-building-behavior';

	const { buildingBehaviorStore, dialogStore, closeDialog, admin } = useBuildingBehavior();
	const scenarioId = $derived(page.params.scenarioId);

	const behaviorId = $derived(
		$dialogStore?.type === 'delete' ? $dialogStore.behaviorId : undefined
	);
	const behavior = $derived(behaviorId ? $buildingBehaviorStore.data[behaviorId] : undefined);
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
				goto(`/admin/scenarios/${scenarioId}/building-behaviors`);
			})
			.catch((error) => {
				console.error('Failed to delete building behavior:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>건물 행동 삭제</DialogTitle>
			<DialogDescription>
				정말로 "{behavior?.name}" 건물 행동을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
