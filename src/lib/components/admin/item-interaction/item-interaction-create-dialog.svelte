<script lang="ts">
	import { useCharacter, useInteraction, useItem } from '$lib/hooks';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import {
		getBehaviorInteractionTypeLabels,
		isOnceInteractionType,
		isFulfillInteractionType,
		isSystemInteractionType,
	} from '$lib/utils/label';
	import { alphabetical } from 'radash';
	import type {
		CharacterId,
		ItemId,
		OnceInteractionType,
		FulfillInteractionType,
		SystemInteractionType,
		ScenarioId,
	} from '$lib/types';
	import { getFallbackString, getActionString } from '$lib/utils/label';

	const { itemStore } = useItem();
	const { characterStore } = useCharacter();
	const {
		itemInteractionDialogStore: itemInteractionDialogStore,
		closeItemInteractionDialog,
		admin,
	} = useInteraction();

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const open = $derived($itemInteractionDialogStore?.type === 'create');

	const items = $derived(alphabetical(Object.values($itemStore.data), (b) => b.name));
	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));

	let itemId = $state<ItemId | undefined>(undefined);
	let interactionType = $state<OnceInteractionType | FulfillInteractionType | SystemInteractionType>('item_use');
	let characterId = $state<CharacterId | undefined>(undefined);
	let isSubmitting = $state(false);

	const interactionTypeOptions = getBehaviorInteractionTypeLabels('item');

	const selectedItem = $derived(items.find((b) => b.id === itemId));
	const selectedItemName = $derived(selectedItem?.name ?? '아이템 선택');
	const selectedCharacter = $derived(characters.find((c) => c.id === characterId));
	const selectedCharacterName = $derived(selectedCharacter?.name ?? getFallbackString('all'));
	const selectedInteractionLabel = $derived(
		interactionTypeOptions.find((o) => o.value === interactionType)?.label ?? '사용'
	);

	function onItemChange(value: string | undefined) {
		itemId = (value as ItemId) || undefined;
	}

	function onInteractionTypeChange(value: string | undefined) {
		if (value) {
			interactionType = value as OnceInteractionType | FulfillInteractionType | SystemInteractionType;
		}
	}

	function onCharacterChange(value: string | undefined) {
		characterId = (value as CharacterId) || undefined;
	}

	function onOpenChange(value: boolean) {
		if (!value) {
			closeItemInteractionDialog();
		}
	}

	async function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (isSubmitting) return;
		if (!itemId) return;

		isSubmitting = true;

		try {
			const type = isOnceInteractionType(interactionType)
				? 'once'
				: isFulfillInteractionType(interactionType)
					? 'fulfill'
					: 'system';

			const itemInteraction = await admin.createItemInteraction(scenarioId, {
				item_id: itemId,
				type,
				once_interaction_type: isOnceInteractionType(interactionType) ? interactionType : null,
				fulfill_interaction_type: isFulfillInteractionType(interactionType)
					? interactionType
					: null,
				system_interaction_type: isSystemInteractionType(interactionType) ? interactionType : null,
				character_id: characterId || null,
			});

			closeItemInteractionDialog();
			goto(`/admin/scenarios/${scenarioId}/item-interactions/${itemInteraction.id}`);
		} catch (error) {
			console.error('Failed to create interaction:', error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>아이템 상호작용 생성</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<ButtonGroup class="w-full">
					<ButtonGroupText>아이템</ButtonGroupText>
					<Select type="single" value={itemId} onValueChange={onItemChange}>
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

				<ButtonGroup class="w-full">
					<ButtonGroupText>상호작용</ButtonGroupText>
					<Select type="single" value={interactionType} onValueChange={onInteractionTypeChange}>
						<SelectTrigger class="flex-1">
							{selectedInteractionLabel}
						</SelectTrigger>
						<SelectContent>
							{#each interactionTypeOptions as option (option.value)}
								<SelectItem value={option.value}>{option.label}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</ButtonGroup>

				<ButtonGroup class="w-full">
					<ButtonGroupText>캐릭터</ButtonGroupText>
					<Select type="single" value={characterId} onValueChange={onCharacterChange}>
						<SelectTrigger class="flex-1">
							{selectedCharacterName}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">모두</SelectItem>
							{#each characters as character (character.id)}
								<SelectItem value={character.id}>{character.name}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</ButtonGroup>
			</div>

			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !itemId}>
					{isSubmitting ? '생성 중...' : '생성'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
