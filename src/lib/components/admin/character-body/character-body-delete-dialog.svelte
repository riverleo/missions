<script lang="ts">
	import { useCharacter } from '$lib/hooks';
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
	import type { ScenarioId } from '$lib/types';
	import { getActionString } from '$lib/utils/label';

	const { characterBodyStore, characterBodyDialogStore, closeCharacterBodyDialog, admin } =
		useCharacter();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentBodyId = $derived(page.params.bodyId);

	const deleteState = $derived(
		$characterBodyDialogStore?.type === 'delete'
			? { open: true, bodyId: $characterBodyDialogStore.bodyId }
			: undefined
	);
	const open = $derived(deleteState?.open ?? false);
	const bodyToDelete = $derived(
		deleteState ? $characterBodyStore.data[deleteState.bodyId] : undefined
	);

	let isDeleting = $state(false);

	function onOpenChange(value: boolean) {
		if (!value) closeCharacterBodyDialog();
	}

	async function onclickDelete() {
		if (!deleteState || isDeleting) return;

		isDeleting = true;
		try {
			await admin.removeCharacterBody(deleteState.bodyId);
			closeCharacterBodyDialog();
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
			<DialogTitle>바디 삭제</DialogTitle>
			<DialogDescription>
				{#if bodyToDelete}
					<strong>{bodyToDelete.name || '이름없음'}</strong>
					바디를 삭제하시겠습니까?
					<br />
					이 바디를 사용하는 캐릭터가 있다면 삭제할 수 없습니다.
				{:else}
					삭제할 바디를 찾을 수 없습니다.
				{/if}
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={() => onOpenChange(false)}>{getActionString("cancel")}</Button>
			<Button variant="destructive" onclick={onclickDelete} disabled={isDeleting || !bodyToDelete}>
				{isDeleting ? '삭제 중...' : '삭제'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
