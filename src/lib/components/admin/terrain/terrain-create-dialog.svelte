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
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId } from '$lib/types';

	const { admin, dialogStore, closeDialog } = useTerrain();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

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
			.then((terrain) => {
				closeDialog();
				goto(`/admin/scenarios/${scenarioId}/terrains/${terrain.id}`);
			})
			.catch((error) => {
				console.error('Failed to create terrain:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>새로운 지형 생성</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="space-y-6">
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<IconHeading class="size-4" />
				</InputGroupAddon>
				<InputGroupInput placeholder="제목" bind:value={title} />
			</InputGroup>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '생성 중...' : '생성하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
