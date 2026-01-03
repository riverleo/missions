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
	import { useItem } from '$lib/hooks/use-item';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId } from '$lib/types';

	const { admin, dialogStore, closeDialog } = useItem();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const open = $derived($dialogStore?.type === 'create');

	let name = $state('');
	let maxDurabilityTicks = $state<number | undefined>(undefined);
	let scale = $state<number>(1.0);
	let width = $state<number>(32.0);
	let height = $state<number>(32.0);
	let isSubmitting = $state(false);

	$effect(() => {
		if (open) {
			name = '';
			maxDurabilityTicks = undefined;
			scale = 1.0;
			width = 32.0;
			height = 32.0;
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.create({
				name: name.trim(),
				max_durability_ticks: maxDurabilityTicks ?? null,
				scale,
				width,
				height,
			})
			.then((item) => {
				closeDialog();
				goto(`/admin/scenarios/${scenarioId}/items/${item.id}`);
			})
			.catch((error) => {
				console.error('Failed to create item:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>새로운 아이템 생성</DialogTitle>
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
						<InputGroupText>
							<IconClock />
						</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput
						type="number"
						placeholder="최대 내구도"
						bind:value={maxDurabilityTicks}
						min="0"
					/>
					<InputGroupAddon align="inline-end">
						<InputGroupText>틱</InputGroupText>
					</InputGroupAddon>
				</InputGroup>
				<div class="flex gap-2">
					<InputGroup class="flex-1">
						<InputGroupAddon align="inline-start">
							<InputGroupText>너비</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput type="number" step="0.01" min="0" bind:value={width} />
						<InputGroupAddon align="inline-end">
							<InputGroupText>px</InputGroupText>
						</InputGroupAddon>
					</InputGroup>
					<InputGroup class="flex-1">
						<InputGroupAddon align="inline-start">
							<InputGroupText>높이</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput type="number" step="0.01" min="0" bind:value={height} />
						<InputGroupAddon align="inline-end">
							<InputGroupText>px</InputGroupText>
						</InputGroupAddon>
					</InputGroup>
					<InputGroup class="flex-1">
						<InputGroupAddon align="inline-start">
							<InputGroupText>스케일</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput type="number" step="0.01" min="0" bind:value={scale} />
						<InputGroupAddon align="inline-end">
							<InputGroupText>배</InputGroupText>
						</InputGroupAddon>
					</InputGroup>
				</div>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '생성 중...' : '생성하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
