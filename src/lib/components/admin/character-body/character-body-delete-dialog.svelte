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
	import { useCharacterBody } from '$lib/hooks/use-character-body';

	const { store, dialogStore, closeDialog, admin } = useCharacterBody();
	const scenarioId = $derived(page.params.scenarioId);
	const currentBodyId = $derived(page.params.bodyId);

	const deleteState = $derived(
		$dialogStore?.type === 'delete' ? { open: true, bodyId: $dialogStore.bodyId } : undefined
	);
	const open = $derived(deleteState?.open ?? false);
	const bodyToDelete = $derived(deleteState ? $store.data[deleteState.bodyId] : undefined);

	let isDeleting = $state(false);

	function onOpenChange(value: boolean) {
		if (!value) closeDialog();
	}

	async function onclickDelete() {
		if (!deleteState || isDeleting) return;

		isDeleting = true;
		try {
			await admin.remove(deleteState.bodyId);
			closeDialog();
			if (currentBodyId === deleteState.bodyId) {
				goto(`/admin/scenarios/${scenarioId}/character-bodies`);
			}
		} catch (error) {
			console.error('Failed to delete character body:', error);
		} finally {
			isDeleting = false;
		}
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>몸통 삭제</DialogTitle>
			<DialogDescription>
				{#if bodyToDelete}
					<strong>{bodyToDelete.name || '이름없음'}</strong> 몸통을 삭제하시겠습니까?
					<br />
					이 몸통을 사용하는 캐릭터가 있다면 삭제할 수 없습니다.
				{:else}
					삭제할 몸통을 찾을 수 없습니다.
				{/if}
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={() => onOpenChange(false)}>취소</Button>
			<Button variant="destructive" onclick={onclickDelete} disabled={isDeleting || !bodyToDelete}>
				{isDeleting ? '삭제 중...' : '삭제'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
