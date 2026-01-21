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
	import type {
		ConditionId,
		CharacterId,
		ConditionBehaviorUpdate,
		BuildingStateType,
	} from '$lib/types';

	const { conditionBehaviorStore, dialogStore, closeDialog, admin } = useConditionBehavior();
	const { conditionStore } = useCondition();
	const { store: characterStore } = useCharacter();

	const open = $derived($dialogStore?.type === 'update');
	const behaviorId = $derived(
		$dialogStore?.type === 'update' ? $dialogStore.conditionBehaviorId : undefined
	);
	const currentBehavior = $derived(
		behaviorId ? $conditionBehaviorStore.data[behaviorId] : undefined
	);
	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));
	const conditions = $derived(alphabetical(Object.values($conditionStore.data), (c) => c.name));

	let conditionId = $state<string | undefined>(undefined);
	let conditionThreshold = $state(0);
	let characterId = $state<string | undefined>(undefined);
	let name = $state('');
	let buildingStateType = $state<BuildingStateType>('idle');
	let isSubmitting = $state(false);

	const buildingStateOptions: { value: BuildingStateType; label: string }[] = [
		{ value: 'idle', label: '기본' },
		{ value: 'damaged', label: '손상됨' },
		{ value: 'planning', label: '계획 중' },
		{ value: 'constructing', label: '건설 중' },
	];

	const selectedCondition = $derived(conditions.find((c) => c.id === conditionId));
	const selectedConditionName = $derived(selectedCondition?.name ?? '컨디션 선택');
	const selectedCharacter = $derived(characters.find((c) => c.id === characterId));
	const selectedCharacterName = $derived(selectedCharacter?.name ?? '모두');

	$effect(() => {
		if (open && currentBehavior) {
			name = currentBehavior.name;
			conditionId = currentBehavior.condition_id;
			conditionThreshold = currentBehavior.condition_threshold;
			characterId = currentBehavior.character_id ?? undefined;
			buildingStateType = currentBehavior.building_state_type;
		}
	});

	function onConditionChange(value: string) {
		conditionId = value || undefined;
	}

	function onCharacterChange(value: string | undefined) {
		characterId = value || undefined;
	}

	function onBuildingStateChange(value: string | undefined) {
		if (value) {
			buildingStateType = value as BuildingStateType;
		}
	}

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!behaviorId || !name.trim() || !conditionId || isSubmitting) return;

		isSubmitting = true;

		admin
			.update(behaviorId, {
				name: name.trim(),
				condition_id: conditionId as ConditionId,
				condition_threshold: conditionThreshold,
				character_id: characterId as CharacterId | undefined,
				building_state_type: buildingStateType,
			} as ConditionBehaviorUpdate)
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
			<div class="flex flex-col gap-2">
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
										<DropdownMenuRadioItem value={condition.id}>
											{condition.name}
										</DropdownMenuRadioItem>
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
					<ButtonGroupText>건물 상태</ButtonGroupText>
					<Select type="single" value={buildingStateType} onValueChange={onBuildingStateChange}>
						<SelectTrigger class="flex-1">
							{buildingStateOptions.find((o) => o.value === buildingStateType)?.label ?? '기본'}
						</SelectTrigger>
						<SelectContent>
							{#each buildingStateOptions as option (option.value)}
								<SelectItem value={option.value}>{option.label}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</ButtonGroup>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !conditionId || !name.trim()}>
					{isSubmitting ? '수정 중...' : '수정하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
