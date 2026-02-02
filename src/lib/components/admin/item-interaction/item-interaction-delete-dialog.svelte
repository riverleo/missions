<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import { useItem } from '$lib/hooks/use-item';
	import type { ScenarioId } from '$lib/types';

	const { itemInteractionDialogStore, closeItemInteractionDialog, admin } = useItem();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const open = $derived($itemInteractionDialogStore?.type === 'delete');
	const itemInteractionId = $derived(
		$itemInteractionDialogStore?.type === 'delete'
			? $itemInteractionDialogStore.itemInteractionId
			: undefined
	);

	let isSubmitting = $state(false);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeItemInteractionDialog();
		}
	}

	async function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!itemInteractionId || isSubmitting) return;

		isSubmitting = true;

		try {
			await admin.removeItemInteraction(itemInteractionId);
			closeItemInteractionDialog();
			goto(`/admin/scenarios/${scenarioId}/item-interactions`);
		} catch (error) {
			console.error('Failed to delete interaction:', error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>아이템 상호작용 삭제</DialogTitle>
			<DialogDescription>이 아이템 상호작용을 삭제하시겠습니까?</DialogDescription>
		</DialogHeader>
		<form {onsubmit}>
			<DialogFooter>
				<Button type="button" variant="outline" onclick={() => closeItemInteractionDialog()}>
					취소
				</Button>
				<Button type="submit" variant="destructive" disabled={isSubmitting}>
					{isSubmitting ? '삭제 중...' : '삭제'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
