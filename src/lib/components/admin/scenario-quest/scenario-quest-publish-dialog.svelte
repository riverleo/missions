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
	import { useQuest } from '$lib/hooks/use-quest';

	const { questStore, admin, dialogStore, closeDialog } = useQuest();

	const open = $derived($dialogStore?.type === 'publish');
	const questId = $derived($dialogStore?.type === 'publish' ? $dialogStore.questId : undefined);
	const currentQuest = $derived(questId ? $questStore.data?.[questId] : undefined);
	const isPublished = $derived(currentQuest?.status === 'published');

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onclick() {
		if (!questId) return;

		const action = isPublished ? admin.unpublishQuest(questId) : admin.publishQuest(questId);

		action
			.then(() => {
				closeDialog();
			})
			.catch((error) => {
				console.error('Failed to toggle publish:', error);
			});
	}
</script>

<AlertDialog {open} {onOpenChange}>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>
				{isPublished ? '퀘스트를 작업중으로 전환하시겠습니까?' : '퀘스트를 공개하시겠습니까?'}
			</AlertDialogTitle>
			<AlertDialogDescription>
				{#if isPublished}
					작업중으로 전환하면 플레이어들이 이 퀘스트를 플레이할 수 없게 됩니다.
				{:else}
					공개하면 플레이어들이 이 퀘스트를 플레이할 수 있게 됩니다.
				{/if}
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel>취소</AlertDialogCancel>
			<AlertDialogAction {onclick}>
				{isPublished ? '작업중으로 전환' : '공개로 전환'}
			</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
