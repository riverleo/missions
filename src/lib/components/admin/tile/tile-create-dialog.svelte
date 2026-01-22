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
		InputGroupInput,
		InputGroupAddon,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { IconHeading, IconClock } from '@tabler/icons-svelte';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId } from '$lib/types';

	const { admin, tileDialogStore, closeTileDialog } = useTerrain();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const open = $derived($tileDialogStore?.type === 'create');

	let name = $state('');
	let maxDurability = $state<number | undefined>(1000);
	let isSubmitting = $state(false);

	$effect(() => {
		if (open) {
			name = '';
			maxDurability = 1000;
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeTileDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.createTile(scenarioId, {
				name: name.trim(),
				max_durability: maxDurability ?? 1000,
			})
			.then((tile) => {
				closeTileDialog();
				goto(`/admin/scenarios/${scenarioId}/tiles/${tile.id}`);
			})
			.catch((error) => {
				console.error('Failed to create tile:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>새로운 타일 생성</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>
							<IconHeading />
						</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput placeholder="이름" bind:value={name} />
				</InputGroup>
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>최대 내구도</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput
						type="number"
						placeholder="숫자 입력"
						bind:value={maxDurability}
						min="0"
					/>
				</InputGroup>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '생성 중...' : '생성하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
