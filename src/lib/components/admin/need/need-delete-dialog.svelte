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
	import { useNeed } from '$lib/hooks/use-need';

	const { needStore, dialogStore, closeDialog, admin } = useNeed();
	const scenarioId = $derived(page.params.scenarioId);

	const needId = $derived($dialogStore?.type === 'delete' ? $dialogStore.needId : undefined);
	const need = $derived(needId ? $needStore.data[needId] : undefined);
	const open = $derived($dialogStore?.type === 'delete');

	let isSubmitting = $state(false);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!needId || !scenarioId || isSubmitting) return;

		isSubmitting = true;

		admin
			.removeNeed(needId)
			.then(() => {
				closeDialog();
				goto(`/admin/scenarios/${scenarioId}/needs`);
			})
			.catch((error) => {
				console.error('Failed to delete need:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>욕구 삭제</DialogTitle>
			<DialogDescription>
				정말로 "{need?.name}" 욕구를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
