<script lang="ts">
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
	import { useItem } from '$lib/hooks/use-item';
	import { useCharacter } from '$lib/hooks/use-character';
	import {
		getItemOnceInteractionTypeOptions,
		getItemRepeatInteractionTypeOptions,
	} from '$lib/utils/state-label';
	import { alphabetical } from 'radash';
	import type {
		CharacterId,
		ItemId,
		OnceInteractionType,
		RepeatInteractionType,
		ScenarioId,
	} from '$lib/types';

	const {
		itemStore,
		itemInteractionDialogStore: itemInteractionDialogStore,
		closeItemInteractionDialog,
		admin,
	} = useItem();
	const { characterStore } = useCharacter();

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const open = $derived($itemInteractionDialogStore?.type === 'create');

	const items = $derived(alphabetical(Object.values($itemStore.data), (b) => b.name));
	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));

	let itemId = $state<ItemId | undefined>(undefined);
	let interactionType = $state<OnceInteractionType | RepeatInteractionType>('item_use');
	let characterId = $state<CharacterId | undefined>(undefined);
	let isSubmitting = $state(false);

	const onceOptions = getItemOnceInteractionTypeOptions();
	const repeatOptions = getItemRepeatInteractionTypeOptions();
	const allOptions = [...onceOptions, ...repeatOptions];

	const selectedItem = $derived(items.find((b) => b.id === itemId));
	const selectedItemName = $derived(
		itemId === undefined ? '기본 (모든 아이템)' : (selectedItem?.name ?? '아이템 선택')
	);
	const selectedCharacter = $derived(characters.find((c) => c.id === characterId));
	const selectedCharacterName = $derived(selectedCharacter?.name ?? '모두');
	const selectedInteractionLabel = $derived(
		allOptions.find((o) => o.value === interactionType)?.label ?? '사용'
	);

	function onItemChange(value: string | undefined) {
		itemId = (value as ItemId) || undefined;
	}

	function onInteractionTypeChange(value: string | undefined) {
		if (value) {
			interactionType = value as OnceInteractionType | RepeatInteractionType;
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

		isSubmitting = true;

		try {
			// Check if it's once or repeat type
			const isOnce = onceOptions.some((o) => o.value === interactionType);

			const itemInteraction = await admin.createItemInteraction(scenarioId, {
				item_id: itemId || null,
				once_interaction_type: isOnce ? (interactionType as OnceInteractionType) : null,
				repeat_interaction_type: isOnce ? null : (interactionType as RepeatInteractionType),
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
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '생성 중...' : '생성'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
