<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupText } from '$lib/components/ui/input-group';
	import { IconX } from '@tabler/icons-svelte';
	import { useCharacter } from '$lib/hooks/use-character';
	import type { CharacterFaceStateId } from '$lib/types';

	const { faceStateStore, admin, faceStateDialogStore, closeFaceStateDialog } = useCharacter();

	const open = $derived($faceStateDialogStore?.type === 'update');
	const characterFaceStateId = $derived(
		$faceStateDialogStore?.type === 'update'
			? $faceStateDialogStore.characterFaceStateId
			: undefined
	);

	// Find the face state from all character face states
	const faceState = $derived.by(() => {
		if (!characterFaceStateId) return undefined;
		for (const states of Object.values($faceStateStore.data)) {
			const state = states.find((s) => s.id === characterFaceStateId);
			if (state) return state;
		}
		return undefined;
	});

	let offsetX = $state('');
	let offsetY = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && faceState) {
			offsetX = faceState.offset_x?.toString() ?? '0';
			offsetY = faceState.offset_y?.toString() ?? '0';
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeFaceStateDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!characterFaceStateId || !faceState || isSubmitting) return;

		isSubmitting = true;

		const offX = parseInt(offsetX) || 0;
		const offY = parseInt(offsetY) || 0;

		admin
			.updateCharacterFaceState(
				characterFaceStateId as CharacterFaceStateId,
				faceState.character_id,
				{
					offset_x: offX,
					offset_y: offY,
				}
			)
			.then(() => {
				closeFaceStateDialog();
			})
			.catch((error) => {
				console.error('Failed to update character face state:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>얼굴 상태 수정</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<InputGroupText>오프셋</InputGroupText>
				</InputGroupAddon>
				<InputGroupInput type="number" bind:value={offsetX} placeholder="x" />
				<InputGroupText>
					<IconX class="size-3" />
				</InputGroupText>
				<InputGroupInput type="number" bind:value={offsetY} placeholder="y" />
			</InputGroup>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '저장 중...' : '저장'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
