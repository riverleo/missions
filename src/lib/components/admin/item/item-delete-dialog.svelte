<script lang="ts">
	import { useItem } from '$lib/hooks';
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

	const { admin, itemDialogStore, closeItemDialog } = useItem();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const open = $derived($itemDialogStore?.type === 'delete');
	const itemId = $derived(
		$itemDialogStore?.type === 'delete' ? $itemDialogStore.itemId : undefined
	);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeItemDialog();
		}
	}

	function onclick() {
		if (!itemId || !scenarioId) return;

		admin
			.removeItem(itemId)
			.then(() => {
				closeItemDialog();
				goto(`/admin/scenarios/${scenarioId}/items`);
			})
			.catch((error) => {
				console.error('Failed to delete item:', error);
			});
	}
</script>

<AlertDialog {open} {onOpenChange}>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>아이템을 삭제하시겠습니까?</AlertDialogTitle>
			<AlertDialogDescription>
				이 작업은 되돌릴 수 없습니다. 아이템과 관련된 모든 데이터가 삭제됩니다.
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel>{getActionString("cancel")}</AlertDialogCancel>
			<AlertDialogAction {onclick}>삭제</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
