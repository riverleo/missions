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
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId } from '$lib/types';

	const { admin } = useNarrative();
	const { store } = admin;

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const open = $derived($store.dialog?.type === 'create');

	let title = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (open) {
			title = '';
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			admin.closeNarrativeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!title.trim() || isSubmitting || !scenarioId) return;

		isSubmitting = true;

		admin
			.createNarrative({ title: title.trim(), scenario_id: scenarioId })
			.then((narrative) => {
				admin.closeNarrativeDialog();
				goto(`/admin/scenarios/${scenarioId}/narratives/${narrative.id}`);
			})
			.catch((error) => {
				console.error('Failed to create narrative:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>새로운 대화 생성</DialogTitle>
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
