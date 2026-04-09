<script lang="ts">
	import { useCharacter } from '$lib/hooks';
	import type { CharacterId } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { IconX } from '@tabler/icons-svelte';

	const {
		admin,
		characterFaceStateDialogStore,
		closeCharacterFaceStateDialog,
		characterFaceStateStore,
	} = useCharacter();

	const open = $derived($characterFaceStateDialogStore?.type === 'update');
	const faceStateId = $derived(
		$characterFaceStateDialogStore?.type === 'update'
			? $characterFaceStateDialogStore.characterFaceStateId
			: undefined
	);

	// 모든 캐릭터의 face states에서 해당 ID 찾기
	const faceStateEntry = $derived.by(() => {
		if (!faceStateId) return undefined;
		for (const [characterId, states] of Object.entries($characterFaceStateStore.data)) {
			const found = states.find((s) => s.id === faceStateId);
			if (found) return { characterId: characterId as CharacterId, faceState: found };
		}
		return undefined;
	});

	const faceState = $derived(faceStateEntry?.faceState);

	let offsetX = $state(0);
	let offsetY = $state(0);
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && faceState) {
			offsetX = faceState.offset_x ?? 0;
			offsetY = faceState.offset_y ?? 0;
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeCharacterFaceStateDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!faceStateId || !faceStateEntry || isSubmitting) return;

		isSubmitting = true;

		admin
			.updateCharacterFaceState(faceStateId, faceStateEntry.characterId, {
				offset_x: offsetX,
				offset_y: offsetY,
			})
			.then(() => {
				closeCharacterFaceStateDialog();
			})
			.catch((error) => {
				console.error('Failed to update face state offset:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>오프셋 수정</DialogTitle>
		</DialogHeader>
		<form {onsubmit}>
			<div class="flex flex-col gap-2">
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>오프셋</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput type="number" step="1" placeholder="0" bind:value={offsetX} />
					<InputGroupText><IconX /></InputGroupText>
					<InputGroupInput type="number" step="1" placeholder="0" bind:value={offsetY} />
				</InputGroup>
			</div>
			<DialogFooter class="mt-4">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '저장 중...' : '저장'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
