<script lang="ts">
	import { useScenario } from '$lib/hooks';
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
	import { getActionString } from '$lib/utils/state-label';

	const { scenarioStore, admin, scenarioDialogStore, closeScenarioDialog } = useScenario();

	const open = $derived($scenarioDialogStore?.type === 'delete');
	const scenarioId = $derived(
		$scenarioDialogStore?.type === 'delete' ? $scenarioDialogStore.scenarioId : undefined
	);
	const currentScenarioId = $derived(page.params.scenarioId);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeScenarioDialog();
		}
	}

	function onclick() {
		if (!scenarioId) return;

		admin
			.removeScenario(scenarioId)
			.then(() => {
				closeScenarioDialog();
				// 삭제된 시나리오가 현재 선택된 시나리오인 경우 첫 번째 시나리오로 이동
				const remainingScenarios = Object.values($scenarioStore.data).filter(
					(s) => s.id !== scenarioId
				);
				const nextScenario = remainingScenarios[0];
				if (scenarioId === currentScenarioId && nextScenario) {
					goto(`/admin/scenarios/${nextScenario.id}/quests`);
				} else if (remainingScenarios.length === 0) {
					goto('/admin');
				}
			})
			.catch((error) => {
				console.error('Failed to delete scenario:', error);
			});
	}
</script>

<AlertDialog {open} {onOpenChange}>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>시나리오를 삭제하시겠습니까?</AlertDialogTitle>
			<AlertDialogDescription>
				이 작업은 되돌릴 수 없습니다. 시나리오와 관련된 모든 퀘스트, 챕터 데이터가 삭제됩니다.
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel>{getActionString("cancel")}</AlertDialogCancel>
			<AlertDialogAction {onclick}>삭제</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
