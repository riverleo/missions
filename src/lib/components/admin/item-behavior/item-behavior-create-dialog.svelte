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
	import { IconHeading, IconChevronDown } from '@tabler/icons-svelte';
	import { useItemBehavior } from '$lib/hooks/use-item-behavior';
	import { useItem } from '$lib/hooks/use-item';
	import { useCharacter } from '$lib/hooks/use-character';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { alphabetical } from 'radash';
	import type { ItemId, CharacterId, CharacterBehaviorType, ScenarioId } from '$lib/types';
	import { getCharacterBehaviorTypeLabel } from '$lib/utils/state-label';

	const { dialogStore, closeDialog, admin } = useItemBehavior();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const { store: itemStore } = useItem();
	const { store: characterStore } = useCharacter();

	const open = $derived($dialogStore?.type === 'create');
	const items = $derived(alphabetical(Object.values($itemStore.data), (i) => i.name));
	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));

	const behaviorTypes: CharacterBehaviorType[] = ['use', 'clean'];

	let name = $state('');
	let itemId = $state<string | undefined>(undefined);
	let durabilityThreshold = $state<number | undefined>(undefined);
	let characterId = $state<string | undefined>(undefined);
	let behaviorType = $state<CharacterBehaviorType>('use');
	let isSubmitting = $state(false);

	const selectedItem = $derived(items.find((i) => i.id === itemId));
	const selectedItemName = $derived(selectedItem?.name ?? '아이템 선택');
	const selectedCharacter = $derived(characters.find((c) => c.id === characterId));
	const selectedCharacterName = $derived(selectedCharacter?.name ?? '모두');
	const selectedTypeName = $derived(getCharacterBehaviorTypeLabel(behaviorType));

	$effect(() => {
		if (open) {
			name = '';
			itemId = undefined;
			durabilityThreshold = undefined;
			characterId = undefined;
			behaviorType = 'use';
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
		if (!itemId || isSubmitting) return;

		isSubmitting = true;

		admin
			.create({
				name: name.trim(),
				item_id: itemId as ItemId,
				durability_threshold: durabilityThreshold ?? null,
				character_id: characterId as CharacterId | undefined,
				character_behavior_type: behaviorType,
			})
			.then((behavior) => {
				closeDialog();
				goto(`/admin/scenarios/${scenarioId}/item-behaviors/${behavior.id}`);
			})
			.catch((error) => {
				console.error('Failed to create item behavior:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>새로운 아이템 행동 생성</DialogTitle>
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

				<ButtonGroup class="w-full">
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

				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>내구도 임계점</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput
						type="number"
						bind:value={durabilityThreshold}
						placeholder="선택적"
					/>
					<InputGroupAddon align="inline-end">
						<InputGroupText>이하</InputGroupText>
					</InputGroupAddon>
				</InputGroup>

				<ButtonGroup class="w-full">
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

				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>행동 타입</InputGroupText>
					</InputGroupAddon>
					<InputGroupAddon align="inline-end">
						<DropdownMenu>
							<DropdownMenuTrigger>
								{#snippet child({ props })}
									<InputGroupButton {...props} variant="ghost">
										{selectedTypeName}
										<IconChevronDown class="size-4" />
									</InputGroupButton>
								{/snippet}
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuRadioGroup value={behaviorType} onValueChange={onTypeChange}>
									{#each behaviorTypes as type (type)}
										<DropdownMenuRadioItem value={type}>
											{getCharacterBehaviorTypeLabel(type)}
										</DropdownMenuRadioItem>
									{/each}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</InputGroupAddon>
				</InputGroup>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !itemId || !name.trim()}>
					{isSubmitting ? '생성 중...' : '생성하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
