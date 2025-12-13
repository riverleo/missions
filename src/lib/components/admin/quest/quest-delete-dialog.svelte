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
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import { goto } from '$app/navigation';

	const { admin, dialogStore, closeDialog } = useQuest();

	const open = $derived($dialogStore?.type === 'delete');
	const questId = $derived($dialogStore?.type === 'delete' ? $dialogStore.questId : undefined);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onclick() {
		if (!questId) return;

		admin
			.remove(questId)
			.then(() => {
				closeDialog();
				goto('/admin/quests');
			})
			.catch((error) => {
				console.error('Failed to delete quest:', error);
			});
	}
</script>

<AlertDialog {open} {onOpenChange}>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>퀘스트를 삭제하시겠습니까?</AlertDialogTitle>
			<AlertDialogDescription>
				이 작업은 되돌릴 수 없습니다. 퀘스트와 관련된 모든 데이터가 삭제됩니다.
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel>취소</AlertDialogCancel>
			<AlertDialogAction {onclick}>삭제</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
