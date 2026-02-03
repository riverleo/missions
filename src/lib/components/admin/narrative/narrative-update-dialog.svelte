<script lang="ts">
	import { useNarrative } from '$lib/hooks';
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

	const { narrativeStore, admin } = useNarrative();
	const { store } = admin;

	const open = $derived($store.dialog?.type === 'update');
	const narrativeId = $derived(
		$store.dialog?.type === 'update' ? $store.dialog.narrativeId : undefined
	);
	const currentNarrative = $derived(narrativeId ? $narrativeStore.data?.[narrativeId] : undefined);

	let title = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && currentNarrative) {
			title = currentNarrative.title;
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			admin.closeNarrativeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!narrativeId || !title.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.updateNarrative(narrativeId, { title: title.trim() })
			.then(() => {
				admin.closeNarrativeDialog();
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
