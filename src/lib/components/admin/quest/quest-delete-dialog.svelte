<script lang="ts">
	import { useQuest } from '$lib/hooks';
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
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId } from '$lib/types';
	import { getActionString } from '$lib/utils/label';

	const { admin, questDialogStore, closeQuestDialog } = useQuest();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const open = $derived($questDialogStore?.type === 'delete');
	const questId = $derived(
		$questDialogStore?.type === 'delete' ? $questDialogStore.questId : undefined
	);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeQuestDialog();
		}
	}

	function onclick() {
		if (!questId || !scenarioId) return;

		admin
			.removeQuest(questId)
			.then(() => {
				closeQuestDialog();
				goto(`/admin/scenarios/${scenarioId}/quests`);
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
			<AlertDialogCancel>{getActionString("cancel")}</AlertDialogCancel>
			<AlertDialogAction {onclick}>삭제</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
