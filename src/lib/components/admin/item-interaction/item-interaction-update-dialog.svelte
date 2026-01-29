<script lang="ts">
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
	import { useItem } from '$lib/hooks/use-item';
	import { useCharacter } from '$lib/hooks/use-character';
	import {
		getItemOnceInteractionTypeOptions,
		getItemRepeatInteractionTypeOptions,
	} from '$lib/utils/state-label';
	import { alphabetical } from 'radash';
	import type {
		ItemId,
		CharacterId,
		OnceInteractionType,
		RepeatInteractionType,
	} from '$lib/types';

	const {
		itemStore,
		itemInteractionStore,
		itemInteractionDialogStore,
		closeItemInteractionDialog,
		admin,
	} = useItem();
	const { characterStore } = useCharacter();

	const open = $derived($itemInteractionDialogStore?.type === 'update');
	const interactionId = $derived(
		$itemInteractionDialogStore?.type === 'update'
			? $itemInteractionDialogStore.interactionId
			: undefined
	);
	const interaction = $derived(
		interactionId ? $itemInteractionStore.data[interactionId] : undefined
	);

	const items = $derived(alphabetical(Object.values($itemStore.data), (b) => b.name));
	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));

	let itemId = $state<string>('');
	let interactionType = $state<OnceInteractionType | RepeatInteractionType>('item_use');
	let characterId = $state<string>('');
	let isSubmitting = $state(false);

	const onceOptions = getItemOnceInteractionTypeOptions();
	const repeatOptions = getItemRepeatInteractionTypeOptions();
	const allOptions = [...onceOptions, ...repeatOptions];

	const selectedItem = $derived(items.find((b) => b.id === itemId));
	const selectedItemName = $derived(
		itemId === '' ? '기본 (모든 아이템)' : selectedItem?.name ?? '아이템 선택'
	);
	const selectedCharacter = $derived(characters.find((c) => c.id === characterId));
	const selectedCharacterName = $derived(selectedCharacter?.name ?? '모두');
	const selectedInteractionLabel = $derived(
		allOptions.find((o) => o.value === interactionType)?.label ?? '사용'
	);

	// interaction이 변경될 때 폼 초기화
	$effect(() => {
		if (interaction) {
			itemId = interaction.item_id;
			interactionType =
				(interaction.once_interaction_type as OnceInteractionType | null) ||
				(interaction.repeat_interaction_type as RepeatInteractionType | null) ||
				'item_use';
			characterId = interaction.character_id || '';
		}
	});

	function onItemChange(value: string | undefined) {
		itemId = value || '';
	}

	function onInteractionTypeChange(value: string | undefined) {
		if (value) {
			interactionType = value as OnceInteractionType | RepeatInteractionType;
		}
	}

	function onCharacterChange(value: string | undefined) {
		characterId = value || '';
	}

	function onOpenChange(value: boolean) {
		if (!value) {
			closeItemInteractionDialog();
		}
	}

	async function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!interactionId || !itemId || isSubmitting) return;

		isSubmitting = true;

		try {
			// Check if it's once or repeat type
			const isOnce = onceOptions.some((o) => o.value === interactionType);

			await admin.updateItemInteraction(interactionId, {
				item_id: itemId ? (itemId as ItemId) : null,
				once_interaction_type: isOnce ? (interactionType as OnceInteractionType) : null,
				repeat_interaction_type: isOnce ? null : (interactionType as RepeatInteractionType),
				character_id: characterId ? (characterId as CharacterId) : null,
			});

			closeItemInteractionDialog();
		} catch (error) {
			console.error('Failed to update interaction:', error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>아이템 상호작용 수정</DialogTitle>
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
							<SelectItem value="">기본 (모든 아이템)</SelectItem>
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
							{#each allOptions as option (option.value)}
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
				<Button type="submit" disabled={!itemId || isSubmitting}>
					{isSubmitting ? '수정 중...' : '수정'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
