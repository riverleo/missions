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
	import { useScenario } from '$lib/hooks/use-scenario';
	import { goto } from '$app/navigation';

	const { store, admin, dialogStore, closeDialog, init } = useScenario();

	const open = $derived($dialogStore?.type === 'delete');
	const scenarioId = $derived($dialogStore?.type === 'delete' ? $dialogStore.scenarioId : undefined);
	const currentScenarioId = $derived($store.currentScenarioId);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onclick() {
		if (!scenarioId) return;

		admin
			.remove(scenarioId)
			.then(() => {
				closeDialog();
				// 삭제된 시나리오가 현재 선택된 시나리오인 경우 첫 번째 시나리오로 이동
				const scenarios = $store.data ?? [];
				const remainingScenarios = scenarios.filter((s) => s.id !== scenarioId);
				if (scenarioId === currentScenarioId && remainingScenarios.length > 0) {
					const nextScenario = remainingScenarios[0];
					init(nextScenario.id);
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
			<AlertDialogCancel>취소</AlertDialogCancel>
			<AlertDialogAction {onclick}>삭제</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
