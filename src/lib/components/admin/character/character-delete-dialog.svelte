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
	import { useCharacter } from '$lib/hooks/use-character';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	const { admin, dialogStore, closeDialog } = useCharacter();
	const scenarioId = $derived(page.params.scenarioId);

	const open = $derived($dialogStore?.type === 'delete');
	const characterId = $derived(
		$dialogStore?.type === 'delete' ? $dialogStore.characterId : undefined
	);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onclick() {
		if (!characterId || !scenarioId) return;

		admin
			.remove(characterId)
			.then(() => {
				closeDialog();
				goto(`/admin/scenarios/${scenarioId}/characters`);
			})
			.catch((error) => {
				console.error('Failed to delete character:', error);
			});
	}
</script>

<AlertDialog {open} {onOpenChange}>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>캐릭터를 삭제하시겠습니까?</AlertDialogTitle>
			<AlertDialogDescription>
				이 작업은 되돌릴 수 없습니다. 캐릭터와 관련된 모든 데이터가 삭제됩니다.
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel>취소</AlertDialogCancel>
			<AlertDialogAction {onclick}>삭제</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
