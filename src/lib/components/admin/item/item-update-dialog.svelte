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
	let decayTicks = $state<number | undefined>(undefined);
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && item) {
			name = item.name ?? '';
			decayTicks = item.decay_ticks ?? undefined;
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
				decay_ticks: decayTicks ?? null,
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
		<form {onsubmit} class="space-y-4">
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
					placeholder="썩는 시간(틱)"
					bind:value={decayTicks}
					min="0"
				/>
			</InputGroup>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !name.trim()}>
					{isSubmitting ? '저장 중...' : '저장'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
