<script lang="ts">
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle,
	} from '$lib/components/ui/alert-dialog';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import { goto } from '$app/navigation';

	const { admin, dialogStore, closeDialog } = useNarrative();

	const open = $derived($dialogStore?.type === 'delete');
	const narrativeId = $derived(
		$dialogStore?.type === 'delete' ? $dialogStore.narrativeId : undefined
	);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onclick() {
		if (!narrativeId) return;

		admin
			.remove(narrativeId)
			.then(() => {
				closeDialog();
				goto('/admin/narratives');
			})
			.catch((error) => {
				console.error('Failed to delete narrative:', error);
			});
	}
</script>

<AlertDialog {open} {onOpenChange}>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>대화 또는 효과를 삭제하시겠습니까?</AlertDialogTitle>
			<AlertDialogDescription>
				이 작업은 되돌릴 수 없습니다. 대화 또는 효과와 관련된 모든 데이터가 삭제됩니다.
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel>취소</AlertDialogCancel>
			<AlertDialogAction {onclick}>삭제</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
