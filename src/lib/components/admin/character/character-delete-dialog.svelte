<script lang="ts">
	import { useCharacter } from '$lib/hooks';
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
	import { getActionString } from '$lib/utils/state-label';

	const { admin, characterDialogStore, closeCharacterDialog } = useCharacter();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const open = $derived($characterDialogStore?.type === 'delete');
	const characterId = $derived(
		$characterDialogStore?.type === 'delete' ? $characterDialogStore.characterId : undefined
	);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeCharacterDialog();
		}
	}

	function onclick() {
		if (!characterId || !scenarioId) return;

		admin
			.removeCharacter(characterId)
			.then(() => {
				closeCharacterDialog();
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
			<AlertDialogCancel>{getActionString("cancel")}</AlertDialogCancel>
			<AlertDialogAction {onclick}>삭제</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
