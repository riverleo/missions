<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import { InputGroup, Input as InputGroupInput, Addon as InputGroupAddon } from '$lib/components/ui/input-group';
	import { Textarea } from '$lib/components/ui/textarea';
	import { IconHeading, IconFileText } from '@tabler/icons-svelte';
	import { useScenario } from '$lib/hooks/use-scenario';

	const { admin, scenarioSnapshotDialogStore, closeScenarioSnapshotDialog } = useScenario();

	const open = $derived($scenarioSnapshotDialogStore?.type === 'create');
	const scenarioId = $derived($scenarioSnapshotDialogStore?.type === 'create' ? $scenarioSnapshotDialogStore.scenarioId : undefined);

	let name = $state('');
	let description = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (open) {
			name = '';
			description = '';
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeScenarioSnapshotDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!scenarioId || !name.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.createScenarioSnapshot(scenarioId, name.trim(), description.trim())
			.then(() => {
				closeScenarioSnapshotDialog();
			})
			.catch((error) => {
				console.error('Failed to create snapshot:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>스냅샷 생성</DialogTitle>
			<DialogDescription>
				현재 시나리오의 모든 마스터 데이터를 스냅샷으로 저장합니다.
				스냅샷은 생성 후 수정하거나 삭제할 수 없습니다.
			</DialogDescription>
		</DialogHeader>
		<form {onsubmit} class="space-y-6">
			<div class="space-y-4">
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<IconHeading class="size-4" />
					</InputGroupAddon>
					<InputGroupInput placeholder="스냅샷 이름 (예: v1.0.0, 2026-01-22)" bind:value={name} />
				</InputGroup>
				<Textarea placeholder="스냅샷 설명 (선택사항)" bind:value={description} rows={3} />
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !name.trim()}>
					{isSubmitting ? '생성 중...' : '생성하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
