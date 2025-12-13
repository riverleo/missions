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
	import { useScenario } from '$lib/hooks/use-scenario.svelte';
	import { useScenarioQuest } from '$lib/hooks/use-scenario-quest.svelte';
	import { goto } from '$app/navigation';

	const { store: scenarioStore } = useScenario();
	const { admin, dialogStore, closeDialog } = useScenarioQuest();
	const currentScenarioId = $derived($scenarioStore.currentScenarioId);

	const open = $derived($dialogStore?.type === 'delete');
	const scenarioQuestId = $derived($dialogStore?.type === 'delete' ? $dialogStore.scenarioQuestId : undefined);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onclick() {
		if (!scenarioQuestId) return;

		admin
			.remove(scenarioQuestId)
			.then(() => {
				closeDialog();
				goto(`/admin/scenarios/${currentScenarioId}/quests`);
			})
			.catch((error) => {
				console.error('Failed to delete scenario quest:', error);
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
