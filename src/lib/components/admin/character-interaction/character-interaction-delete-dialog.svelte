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
	import { useCharacter } from '$lib/hooks/use-character';
	import type { ScenarioId } from '$lib/types';

	const { characterInteractionDialogStore, closeCharacterInteractionDialog, admin } =
		useCharacter();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const open = $derived($characterInteractionDialogStore?.type === 'delete');
	const interactionId = $derived(
		$characterInteractionDialogStore?.type === 'delete'
			? $characterInteractionDialogStore.interactionId
			: undefined
	);

	let isSubmitting = $state(false);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeCharacterInteractionDialog();
		}
	}

	async function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!interactionId || isSubmitting) return;

		isSubmitting = true;

		try {
			await admin.removeCharacterInteraction(interactionId);
			closeCharacterInteractionDialog();
			goto(`/admin/scenarios/${scenarioId}/character-interactions`);
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
			<DialogTitle>캐릭터 상호작용 삭제</DialogTitle>
			<DialogDescription>이 캐릭터 상호작용을 삭제하시겠습니까?</DialogDescription>
		</DialogHeader>
		<form {onsubmit}>
			<DialogFooter>
				<Button type="button" variant="outline" onclick={() => closeCharacterInteractionDialog()}>
					취소
				</Button>
				<Button type="submit" variant="destructive" disabled={isSubmitting}>
					{isSubmitting ? '삭제 중...' : '삭제'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
