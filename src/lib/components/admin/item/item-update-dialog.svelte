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

	const { store, admin, dialogStore, closeDialog } = useItem();

	const open = $derived($dialogStore?.type === 'update');
	const itemId = $derived($dialogStore?.type === 'update' ? $dialogStore.itemId : undefined);
	const item = $derived(itemId ? $store.data[itemId] : undefined);

	let name = $state('');
	let maxDurabilityTicks = $state<number | undefined>(undefined);
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && item) {
			name = item.name ?? '';
			maxDurabilityTicks = item.max_durability_ticks ?? undefined;
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!itemId || !name.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.update(itemId, {
				name: name.trim(),
				max_durability_ticks: maxDurabilityTicks ?? null,
			})
			.then(() => {
				closeDialog();
			})
			.catch((error) => {
				console.error('Failed to update item:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>아이템 수정</DialogTitle>
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
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !name.trim()}>
					{isSubmitting ? '저장 중...' : '저장'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
