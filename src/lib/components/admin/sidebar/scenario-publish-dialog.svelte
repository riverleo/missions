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

	const { store, admin, dialogStore, closeDialog } = useScenario();

	const open = $derived($dialogStore?.type === 'publish');
	const scenarioId = $derived(
		$dialogStore?.type === 'publish' ? $dialogStore.scenarioId : undefined
	);
	const currentScenario = $derived(scenarioId ? $store.data?.[scenarioId] : undefined);
	const isPublished = $derived(currentScenario?.status === 'published');

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onclick() {
		if (!scenarioId) return;

		const action = isPublished ? admin.unpublish(scenarioId) : admin.publish(scenarioId);

		action
			.then(() => {
				closeDialog();
			})
			.catch((error) => {
				console.error('Failed to toggle publish:', error);
			});
	}
</script>

<AlertDialog {open} {onOpenChange}>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>
				{isPublished ? '시나리오를 작업중으로 전환하시겠습니까?' : '시나리오를 공개하시겠습니까?'}
			</AlertDialogTitle>
			<AlertDialogDescription>
				{#if isPublished}
					작업중으로 전환하면 플레이어들이 이 시나리오를 플레이할 수 없게 됩니다.
				{:else}
					공개하면 플레이어들이 이 시나리오를 플레이할 수 있게 됩니다.
				{/if}
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel>취소</AlertDialogCancel>
			<AlertDialogAction {onclick}>
				{isPublished ? '작업중으로 전환' : '공개로 전환'}
			</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
