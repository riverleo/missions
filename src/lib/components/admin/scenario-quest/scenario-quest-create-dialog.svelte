<script lang="ts">
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
		Input as InputGroupInput,
		Addon as InputGroupAddon,
	} from '$lib/components/ui/input-group';
	import { IconHeading } from '@tabler/icons-svelte';
	import { useScenarioQuest } from '$lib/hooks/use-scenario-quest.svelte';

	const { admin, dialogStore, closeDialog } = useScenarioQuest();

	const open = $derived($dialogStore?.type === 'create');

	let title = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (open) {
			title = '';
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!title.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.create({ title: title.trim() })
			.then(() => {
				closeDialog();
			})
			.catch((error) => {
				console.error('Failed to create scenario quest:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>새로운 퀘스트 만들기</DialogTitle>
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
					{isSubmitting ? '생성 중...' : '생성하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
