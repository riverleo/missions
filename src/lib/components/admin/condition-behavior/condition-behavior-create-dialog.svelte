<script lang="ts">
	import { useBehavior, useBuilding, useCharacter } from '$lib/hooks';
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
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { alphabetical } from 'radash';
	import type {
		ConditionId,
		CharacterId,
		ScenarioId,
		ConditionBehaviorInsert,
	} from '$lib/types';
	import { getFallbackString, getActionString, getFormString } from '$lib/utils/label';

	const { conditionBehaviorDialogStore, closeConditionBehaviorDialog, admin } = useBehavior();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const { conditionStore, getOrUndefinedCondition } = useBuilding();
	const { characterStore, getOrUndefinedCharacter } = useCharacter();

	const open = $derived($conditionBehaviorDialogStore?.type === 'create');
	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));
	const conditions = $derived(alphabetical(Object.values($conditionStore.data), (c) => c.name));

	let conditionId = $state<string | undefined>(undefined);
	let conditionThreshold = $state(0);
	let characterId = $state<string | undefined>(undefined);
	let name = $state('');
	let isSubmitting = $state(false);

	const selectedCondition = $derived(getOrUndefinedCondition(conditionId));
	const selectedConditionName = $derived(selectedCondition?.name ?? '컨디션 선택');
	const selectedCharacterName = $derived(getOrUndefinedCharacter(characterId)?.name ?? getFallbackString('all'));

	$effect(() => {
		if (open) {
			name = '';
			conditionId = undefined;
			conditionThreshold = 0;
			characterId = undefined;
		}
	});

	function onConditionChange(value: string) {
		conditionId = value || undefined;
	}

	function onCharacterChange(value: string | undefined) {
		characterId = value || undefined;
	}

	function onOpenChange(value: boolean) {
		if (!value) {
			closeConditionBehaviorDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim() || !conditionId || isSubmitting) return;

		isSubmitting = true;

		admin
			.createConditionBehavior(scenarioId, {
				name: name.trim(),
				condition_id: conditionId as ConditionId,
				condition_threshold: conditionThreshold,
				character_id: characterId as CharacterId | undefined,
			} as Omit<ConditionBehaviorInsert, 'scenario_id'>)
			.then((behavior) => {
				closeConditionBehaviorDialog();
				goto(`/admin/scenarios/${scenarioId}/condition-behaviors/${behavior.id}`);
			})
			.catch((error) => {
				console.error('Failed to create condition behavior:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>새로운 컨디션 행동 생성</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>
							<IconHeading />
						</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput placeholder={getFormString("name")} bind:value={name} />
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
				</ButtonGroup>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !conditionId || !name.trim()}>
					{isSubmitting ? getActionString('creating') : getActionString('createAction')}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
