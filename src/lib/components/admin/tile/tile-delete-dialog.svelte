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

	const { admin, tileDialogStore, closeTileDialog } = useTerrain();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const open = $derived($tileDialogStore?.type === 'delete');
	const tileId = $derived($tileDialogStore?.type === 'delete' ? $tileDialogStore.tileId : undefined);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeTileDialog();
		}
	}

	function onclick() {
		if (!tileId || !scenarioId) return;

		admin
			.removeTile(tileId)
			.then(() => {
				closeTileDialog();
				goto(`/admin/scenarios/${scenarioId}/tiles`);
			})
			.catch((error) => {
				console.error('Failed to delete tile:', error);
			});
	}
</script>

<AlertDialog {open} {onOpenChange}>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>타일을 삭제하시겠습니까?</AlertDialogTitle>
			<AlertDialogDescription>
				이 작업은 되돌릴 수 없습니다. 타일과 관련된 모든 데이터가 삭제됩니다.
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel>취소</AlertDialogCancel>
			<AlertDialogAction {onclick}>삭제</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
