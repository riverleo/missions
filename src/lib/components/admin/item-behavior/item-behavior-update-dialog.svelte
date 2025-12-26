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
		InputGroupButton,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuRadioGroup,
		DropdownMenuRadioItem,
	} from '$lib/components/ui/dropdown-menu';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { IconChevronDown } from '@tabler/icons-svelte';
	import { useItemBehavior } from '$lib/hooks/use-item-behavior';
	import { useItem } from '$lib/hooks/use-item';
	import { useCharacter } from '$lib/hooks/use-character';
	import { alphabetical } from 'radash';
	import type { ItemId, CharacterId, CharacterBehaviorType } from '$lib/types';
	import { getCharacterBehaviorTypeLabel } from '$lib/utils/state-label';

	const { itemBehaviorStore, dialogStore, closeDialog, admin } = useItemBehavior();
	const { store: itemStore } = useItem();
	const { store: characterStore } = useCharacter();

	const open = $derived($dialogStore?.type === 'update');
	const behaviorId = $derived(
		$dialogStore?.type === 'update' ? $dialogStore.behaviorId : undefined
	);
	const currentBehavior = $derived(behaviorId ? $itemBehaviorStore.data[behaviorId] : undefined);
	const items = $derived(alphabetical(Object.values($itemStore.data), (i) => i.name));
	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));

	const behaviorTypes: CharacterBehaviorType[] = ['clean'];

	let name = $state('');
	let itemId = $state<string | undefined>(undefined);
	let durabilityThreshold = $state<number | undefined>(undefined);
	let characterId = $state<string | undefined>(undefined);
	let behaviorType = $state<CharacterBehaviorType>('clean');
	let isSubmitting = $state(false);

	const selectedItem = $derived(items.find((i) => i.id === itemId));
	const selectedItemName = $derived(selectedItem?.name ?? '아이템 선택');
	const selectedCharacter = $derived(characters.find((c) => c.id === characterId));
	const selectedCharacterName = $derived(selectedCharacter?.name ?? '모두');
	const selectedTypeName = $derived(getCharacterBehaviorTypeLabel(behaviorType));

	$effect(() => {
		if (open && currentBehavior) {
			name = currentBehavior.name;
			itemId = currentBehavior.item_id;
			durabilityThreshold = currentBehavior.durability_threshold ?? undefined;
			characterId = currentBehavior.character_id ?? undefined;
			behaviorType = currentBehavior.character_behavior_type;
		}
	});

	function onItemChange(value: string | undefined) {
		itemId = value || undefined;
	}

	function onCharacterChange(value: string | undefined) {
		characterId = value || undefined;
	}

	function onTypeChange(value: string | undefined) {
		if (value) {
			behaviorType = value as CharacterBehaviorType;
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
				name: name.trim(),
				item_id: itemId as ItemId,
				durability_threshold: durabilityThreshold ?? null,
				character_id: characterId as CharacterId | undefined,
				character_behavior_type: behaviorType,
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
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<DropdownMenu>
							<DropdownMenuTrigger>
								{#snippet child({ props })}
									<InputGroupButton {...props} variant="ghost">
										{selectedItemName}
										<IconChevronDown class="size-4" />
									</InputGroupButton>
								{/snippet}
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start">
								<DropdownMenuRadioGroup value={itemId ?? ''} onValueChange={onItemChange}>
									{#each items as item (item.id)}
										<DropdownMenuRadioItem value={item.id}>
											{item.name}
										</DropdownMenuRadioItem>
									{/each}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</InputGroupAddon>
					<InputGroupInput placeholder="이름" bind:value={name} />
				</InputGroup>
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
										{getCharacterBehaviorTypeLabel(type)}
									</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</ButtonGroup>
					<ButtonGroup class="flex-1">
						<ButtonGroupText>캐릭터</ButtonGroupText>
						<Select type="single" value={characterId ?? ''} onValueChange={onCharacterChange}>
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
				</ButtonGroup>
				{#if behaviorType === 'clean'}
					<InputGroup>
						<InputGroupAddon align="inline-start">
							<InputGroupText>내구도</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput type="number" bind:value={durabilityThreshold} placeholder="0" />
						<InputGroupAddon align="inline-end">
							<InputGroupText>/ 이하</InputGroupText>
						</InputGroupAddon>
					</InputGroup>
				{/if}
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !itemId || !name.trim()}>
					{isSubmitting ? '수정 중...' : '수정하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
