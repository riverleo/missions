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
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId } from '$lib/types';

	const { admin, terrainDialogStore, closeTerrainDialog } = useTerrain();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const open = $derived($terrainDialogStore?.type === 'delete');
	const terrainId = $derived($terrainDialogStore?.type === 'delete' ? $terrainDialogStore.terrainId : undefined);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeTerrainDialog();
		}
	}

	function onclick() {
		if (!terrainId || !scenarioId) return;

		admin
			.removeTerrain(terrainId)
			.then(() => {
				closeTerrainDialog();
				goto(`/admin/scenarios/${scenarioId}/terrains`);
			})
			.catch((error) => {
				console.error('Failed to delete terrain:', error);
			});
	}
</script>

<AlertDialog {open} {onOpenChange}>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>지형을 삭제하시겠습니까?</AlertDialogTitle>
			<AlertDialogDescription>
				이 작업은 되돌릴 수 없습니다. 지형과 관련된 모든 데이터가 삭제됩니다.
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel>취소</AlertDialogCancel>
			<AlertDialogAction {onclick}>삭제</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
