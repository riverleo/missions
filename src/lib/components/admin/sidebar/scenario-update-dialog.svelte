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
	import { useScenario } from '$lib/hooks/use-scenario.svelte';

	const { store, admin, dialogStore, closeDialog } = useScenario();

	const open = $derived($dialogStore?.type === 'update');
	const scenarioId = $derived($dialogStore?.type === 'update' ? $dialogStore.scenarioId : undefined);
	const currentScenario = $derived(
		scenarioId ? $store.data?.find((s) => s.id === scenarioId) : undefined
	);

	let title = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && currentScenario) {
			title = currentScenario.title;
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!scenarioId || !title.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.update(scenarioId, { title: title.trim() })
			.then(() => {
				closeDialog();
			})
			.catch((error) => {
				console.error('Failed to update scenario:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>시나리오 수정하기</DialogTitle>
		</DialogHeader>
		<form {onsubmit}>
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<IconHeading class="size-4" />
				</InputGroupAddon>
				<InputGroupInput placeholder="제목" bind:value={title} />
				<InputGroupAddon align="inline-end">
					<span class="text-xs text-muted-foreground">{title.length}</span>
				</InputGroupAddon>
			</InputGroup>
			<DialogFooter class="mt-4">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '수정 중...' : '수정하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
