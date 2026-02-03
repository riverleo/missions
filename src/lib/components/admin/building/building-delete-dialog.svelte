<script lang="ts">
	import { useBuilding } from '$lib/hooks';
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

	const { admin, buildingDialogStore, closeBuildingDialog } = useBuilding();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const open = $derived($buildingDialogStore?.type === 'delete');
	const buildingId = $derived(
		$buildingDialogStore?.type === 'delete' ? $buildingDialogStore.buildingId : undefined
	);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeBuildingDialog();
		}
	}

	function onclick() {
		if (!buildingId || !scenarioId) return;

		admin
			.removeBuilding(buildingId)
			.then(() => {
				closeBuildingDialog();
				goto(`/admin/scenarios/${scenarioId}/buildings`);
			})
			.catch((error) => {
				console.error('Failed to delete building:', error);
			});
	}
</script>

<AlertDialog {open} {onOpenChange}>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>건물을 삭제하시겠습니까?</AlertDialogTitle>
			<AlertDialogDescription>
				이 작업은 되돌릴 수 없습니다. 건물과 관련된 모든 데이터가 삭제됩니다.
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel>취소</AlertDialogCancel>
			<AlertDialogAction {onclick}>삭제</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
