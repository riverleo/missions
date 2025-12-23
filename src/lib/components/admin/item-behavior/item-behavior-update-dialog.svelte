<script lang="ts">
	import type { ItemBehaviorId, ItemBehaviorActionId } from '$lib/types';
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
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { IconHeading } from '@tabler/icons-svelte';
	import { useItemBehavior } from '$lib/hooks/use-item-behavior';
	import { useItem } from '$lib/hooks/use-item';
	import { alphabetical } from 'radash';
	import type { ItemBehaviorType, ItemId } from '$lib/types';
	import { getItemBehaviorTypeLabel } from '$lib/utils/state-label';

	const { itemBehaviorStore, dialogStore, closeDialog, admin } = useItemBehavior();
	const { store: itemStore } = useItem();

	const open = $derived($dialogStore?.type === 'update');
	const behaviorId = $derived(
		$dialogStore?.type === 'update' ? $dialogStore.behaviorId : undefined
	);
	const currentBehavior = $derived(
		behaviorId ? $itemBehaviorStore.data[behaviorId] : undefined
	);
	const items = $derived(alphabetical(Object.values($itemStore.data), (i) => i.name));

	const behaviorTypes: ItemBehaviorType[] = ['pickup', 'using', 'drop'];

	let description = $state('');
	let itemId = $state<string | undefined>(undefined);
	let behaviorType = $state<ItemBehaviorType>('using');
	let isSubmitting = $state(false);

	const selectedItem = $derived(items.find((i) => i.id === itemId));
	const selectedItemName = $derived(selectedItem?.name ?? '아이템 선택');
	const selectedTypeName = $derived(getItemBehaviorTypeLabel(behaviorType));

	$effect(() => {
		if (open && currentBehavior) {
			description = currentBehavior.description;
			itemId = currentBehavior.item_id;
			behaviorType = currentBehavior.type;
		}
	});

	function onItemChange(value: string | undefined) {
		itemId = value || undefined;
	}

	function onTypeChange(value: string | undefined) {
		if (value) {
			behaviorType = value as ItemBehaviorType;
		}
	}

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!behaviorId || !itemId || isSubmitting) return;

		isSubmitting = true;

		admin
			.update(behaviorId, {
				description: description.trim(),
				item_id: itemId as ItemId,
				type: behaviorType,
			})
			.then(() => {
				closeDialog();
			})
			.catch((error) => {
				console.error('Failed to update item behavior:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>아이템 행동 수정</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<ButtonGroup class="w-full gap-2">
					<ButtonGroup class="flex-1">
						<ButtonGroupText>행동</ButtonGroupText>
						<Select type="single" value={behaviorType} onValueChange={onTypeChange}>
							<SelectTrigger class="flex-1">
								{selectedTypeName}
							</SelectTrigger>
							<SelectContent>
								{#each behaviorTypes as type (type)}
									<SelectItem value={type}>
										{getItemBehaviorTypeLabel(type)}
									</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</ButtonGroup>
					<ButtonGroup class="flex-1">
						<ButtonGroupText>아이템</ButtonGroupText>
						<Select type="single" value={itemId ?? ''} onValueChange={onItemChange}>
							<SelectTrigger class="flex-1">
								{selectedItemName}
							</SelectTrigger>
							<SelectContent>
								{#each items as item (item.id)}
									<SelectItem value={item.id}>{item.name}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</ButtonGroup>
				</ButtonGroup>
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>
							<IconHeading />
						</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput placeholder="설명" bind:value={description} />
				</InputGroup>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !itemId}>
					{isSubmitting ? '수정 중...' : '수정하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
