<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import { InputGroup, InputGroupInput, InputGroupAddon } from '$lib/components/ui/input-group';
	import { IconHeading } from '@tabler/icons-svelte';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';

	const { store, admin, dialogStore, closeDialog } = useNarrative();

	const open = $derived($dialogStore?.type === 'update');
	const narrativeId = $derived(
		$dialogStore?.type === 'update' ? $dialogStore.narrativeId : undefined
	);
	const currentNarrative = $derived(
		narrativeId ? $store.data?.find((n) => n.id === narrativeId) : undefined
	);

	let title = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && currentNarrative) {
			title = currentNarrative.title;
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!narrativeId || !title.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.update(narrativeId, { title: title.trim() })
			.then(() => {
				closeDialog();
			})
			.catch((error) => {
				console.error('Failed to update narrative:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>대화 또는 효과 수정</DialogTitle>
		</DialogHeader>
		<form {onsubmit}>
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<IconHeading class="size-4" />
				</InputGroupAddon>
				<InputGroupInput placeholder="제목" bind:value={title} />
			</InputGroup>
			<DialogFooter class="mt-4">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '수정 중...' : '수정하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
