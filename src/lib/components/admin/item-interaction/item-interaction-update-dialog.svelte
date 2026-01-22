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
	import { alphabetical } from 'radash';
	import type { ItemId, CharacterId, CharacterBehaviorType } from '$lib/types';

	const { itemStore, itemInteractionStore, itemInteractionDialogStore, closeItemInteractionDialog, admin } =
		useItem();
	const { characterStore } = useCharacter();

	const open = $derived($itemInteractionDialogStore?.type === 'update');
	const interactionId = $derived(
		$itemInteractionDialogStore?.type === 'update' ? $itemInteractionDialogStore.interactionId : undefined
	);
	const interaction = $derived(
		interactionId ? $itemInteractionStore.data[interactionId] : undefined
	);

	const items = $derived(alphabetical(Object.values($itemStore.data), (b) => b.name));
	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));

	let itemId = $state<string>('');
	let characterBehaviorType = $state<CharacterBehaviorType>('use');
	let characterId = $state<string>('');
	let isSubmitting = $state(false);

	const behaviorTypeOptions: { value: CharacterBehaviorType; label: string }[] = [
		{ value: 'demolish', label: '철거' },
		{ value: 'use', label: '사용' },
		{ value: 'repair', label: '수리' },
		{ value: 'clean', label: '청소' },
		{ value: 'pick', label: '줍기' },
	];

	const selectedItem = $derived(items.find((b) => b.id === itemId));
	const selectedItemName = $derived(selectedItem?.name ?? '아이템 선택');
	const selectedCharacter = $derived(characters.find((c) => c.id === characterId));
	const selectedCharacterName = $derived(selectedCharacter?.name ?? '모두');
	const selectedBehaviorLabel = $derived(
		behaviorTypeOptions.find((o) => o.value === characterBehaviorType)?.label ?? '사용'
	);

	// interaction이 변경될 때 폼 초기화
	$effect(() => {
		if (interaction) {
			itemId = interaction.item_id;
			characterBehaviorType = interaction.character_behavior_type;
			characterId = interaction.character_id || '';
		}
	});

	function onItemChange(value: string | undefined) {
		itemId = value || '';
	}

	function onBehaviorTypeChange(value: string | undefined) {
		if (value) {
			characterBehaviorType = value as CharacterBehaviorType;
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
			await admin.updateItemInteraction(interactionId, {
				item_id: itemId as ItemId,
				character_behavior_type: characterBehaviorType,
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
							{#each items as item (item.id)}
								<SelectItem value={item.id}>{item.name}</SelectItem>
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
					<ButtonGroupText>행동</ButtonGroupText>
					<Select type="single" value={characterBehaviorType} onValueChange={onBehaviorTypeChange}>
						<SelectTrigger class="flex-1">
							{selectedBehaviorLabel}
						</SelectTrigger>
						<SelectContent>
							{#each behaviorTypeOptions as option (option.value)}
								<SelectItem value={option.value}>{option.label}</SelectItem>
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
