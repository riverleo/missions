<script lang="ts">
	import { useItem } from '$lib/hooks';
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
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import type { ItemStateId, ItemId } from '$lib/types';
	import { getActionString } from '$lib/utils/label';

	const { itemStateStore, admin, itemStateDialogStore, closeStateDialog, getOrUndefinedItem } =
		useItem();

	const open = $derived($itemStateDialogStore?.type === 'update');
	const itemStateId = $derived(
		$itemStateDialogStore?.type === 'update' ? $itemStateDialogStore.itemStateId : undefined
	);

	// Find the item state from all item states
	const itemState = $derived.by(() => {
		if (!itemStateId) return undefined;
		for (const states of Object.values($itemStateStore.data)) {
			const state = states.find((s) => s.id === itemStateId);
			if (state) return state;
		}
		return undefined;
	});

	const item = $derived(itemState ? getOrUndefinedItem(itemState.item_id as ItemId) : undefined);

	let minDurability = $state('');
	let maxDurability = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && itemState) {
			minDurability = itemState.min_durability.toString();
			maxDurability = itemState.max_durability.toString();
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeStateDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!itemStateId || !itemState || isSubmitting) return;

		isSubmitting = true;

		const min = parseInt(minDurability) || 0;
		const max = parseInt(maxDurability) || 100;

		admin
			.updateItemState(itemStateId as ItemStateId, itemState.item_id, {
				min_durability: min,
				max_durability: max,
			})
			.then(() => {
				closeStateDialog();
			})
			.catch((error) => {
				console.error('Failed to update item state:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>아이템 상태 수정</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<Tooltip>
							<TooltipTrigger>
								{#snippet child({ props })}
									<InputGroupButton {...props}>내구도</InputGroupButton>
								{/snippet}
							</TooltipTrigger>
							<TooltipContent>이 상태가 활성화되는 내구도 범위를 설정합니다</TooltipContent>
						</Tooltip>
					</InputGroupAddon>
					<InputGroupInput
						placeholder="최소"
						type="number"
						bind:value={minDurability}
						disabled={!item?.max_durability_ticks}
					/>
					<InputGroupText>~</InputGroupText>
					<InputGroupInput
						placeholder="최대"
						type="number"
						bind:value={maxDurability}
						disabled={!item?.max_durability_ticks}
					/>
					<InputGroupAddon align="inline-end">
						{#if item?.max_durability_ticks}
							<InputGroupText>
								틱 (최대 {item.max_durability_ticks.toLocaleString()} 틱)
							</InputGroupText>
						{:else}
							<InputGroupText>최대 내구도 없음</InputGroupText>
						{/if}
					</InputGroupAddon>
				</InputGroup>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '저장 중...' : '저장'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
