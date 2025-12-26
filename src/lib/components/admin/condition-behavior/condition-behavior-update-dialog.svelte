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
	import { IconChevronDown, IconHeading } from '@tabler/icons-svelte';
	import { useConditionBehavior } from '$lib/hooks/use-condition-behavior';
	import { useCondition } from '$lib/hooks/use-condition';
	import { useCharacter } from '$lib/hooks/use-character';
	import { alphabetical } from 'radash';
	import type { CharacterBehaviorType, ConditionId, CharacterId } from '$lib/types';
	import { getCharacterBehaviorTypeLabel } from '$lib/utils/state-label';

	const { conditionBehaviorStore, dialogStore, closeDialog, admin } = useConditionBehavior();
	const { conditionStore } = useCondition();
	const { store: characterStore } = useCharacter();

	const open = $derived($dialogStore?.type === 'update');
	const behaviorId = $derived(
		$dialogStore?.type === 'update' ? $dialogStore.behaviorId : undefined
	);
	const currentBehavior = $derived(
		behaviorId ? $conditionBehaviorStore.data[behaviorId] : undefined
	);
	const conditions = $derived(alphabetical(Object.values($conditionStore.data), (c) => c.name));
	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));

	const behaviorTypes: CharacterBehaviorType[] = ['demolish', 'use', 'repair', 'clean'];

	let name = $state('');
	let conditionId = $state<string | undefined>(undefined);
	let conditionThreshold = $state(0);
	let characterId = $state<string | undefined>(undefined);
	let behaviorType = $state<CharacterBehaviorType>('use');
	let isSubmitting = $state(false);

	const selectedCondition = $derived(conditions.find((c) => c.id === conditionId));
	const selectedConditionName = $derived(selectedCondition?.name ?? '컨디션 선택');
	const selectedCharacter = $derived(characters.find((c) => c.id === characterId));
	const selectedCharacterName = $derived(selectedCharacter?.name ?? '모두');
	const selectedTypeName = $derived(getCharacterBehaviorTypeLabel(behaviorType));

	$effect(() => {
		if (open && currentBehavior) {
			name = currentBehavior.name;
			conditionId = currentBehavior.condition_id;
			conditionThreshold = currentBehavior.condition_threshold;
			characterId = currentBehavior.character_id ?? undefined;
			behaviorType = currentBehavior.character_behavior_type;
		}
	});

	function onConditionChange(value: string) {
		conditionId = value || undefined;
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
		if (!behaviorId || !conditionId || isSubmitting) return;

		isSubmitting = true;

		admin
			.update(behaviorId, {
				name: name.trim(),
				condition_id: conditionId as ConditionId,
				condition_threshold: conditionThreshold,
				character_id: characterId as CharacterId | undefined,
				character_behavior_type: behaviorType,
			})
			.then(() => {
				closeDialog();
			})
			.catch((error) => {
				console.error('Failed to update condition behavior:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>컨디션 행동 수정</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<IconHeading />
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
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<DropdownMenu>
						<DropdownMenuTrigger>
							{#snippet child({ props })}
								<InputGroupButton {...props} variant="ghost">
									{selectedConditionName}
									<IconChevronDown class="ml-1 size-4" />
								</InputGroupButton>
							{/snippet}
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							<DropdownMenuRadioGroup value={conditionId ?? ''} onValueChange={onConditionChange}>
								{#each conditions as condition (condition.id)}
									<DropdownMenuRadioItem value={condition.id}>{condition.name}</DropdownMenuRadioItem>
								{/each}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</InputGroupAddon>
				<InputGroupInput
					type="number"
					placeholder="0"
					step="1"
					min="0"
					max={selectedCondition?.max_value ?? 100}
					bind:value={conditionThreshold}
				/>
				<InputGroupAddon align="inline-end">
					<InputGroupText>/ {selectedCondition?.max_value ?? 100} 이하</InputGroupText>
				</InputGroupAddon>
			</InputGroup>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !conditionId}>
					{isSubmitting ? '수정 중...' : '수정하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
