<script lang="ts">
	import { useScenario } from '$lib/hooks';
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

	const { scenarioStore, admin, scenarioDialogStore, closeScenarioDialog } = useScenario();

	const open = $derived($scenarioDialogStore?.type === 'update');
	const scenarioId = $derived(
		$scenarioDialogStore?.type === 'update' ? $scenarioDialogStore.scenarioId : undefined
	);
	const currentScenario = $derived(scenarioId ? $scenarioStore.data?.[scenarioId] : undefined);

	let title = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && currentScenario) {
			title = currentScenario.title;
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeScenarioDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!scenarioId || !title.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.updateScenario(scenarioId, { title: title.trim() })
			.then(() => {
				closeScenarioDialog();
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
			<DialogTitle>시나리오 수정</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="space-y-6">
			<div class="space-y-2">
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<IconHeading class="size-4" />
					</InputGroupAddon>
					<InputGroupInput placeholder="제목" bind:value={title} />
					<InputGroupAddon align="inline-end">
						<span class="text-xs text-muted-foreground">{title.length}</span>
					</InputGroupAddon>
				</InputGroup>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '수정 중...' : '수정하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
