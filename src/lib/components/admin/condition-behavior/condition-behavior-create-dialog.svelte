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
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { IconHeading } from '@tabler/icons-svelte';
	import { useConditionBehavior } from '$lib/hooks/use-condition-behavior';
	import { useCondition } from '$lib/hooks/use-condition';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { alphabetical } from 'radash';
	import type { CharacterBehaviorType, ConditionId, ScenarioId } from '$lib/types';
	import { getCharacterBehaviorTypeLabel } from '$lib/utils/state-label';

	const { dialogStore, closeDialog, admin } = useConditionBehavior();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const { conditionStore } = useCondition();

	const open = $derived($dialogStore?.type === 'create');
	const conditions = $derived(alphabetical(Object.values($conditionStore.data), (b) => b.name));

	const behaviorTypes: CharacterBehaviorType[] = ['demolish', 'use', 'repair', 'clean'];

	let name = $state('');
	let conditionId = $state<string | undefined>(undefined);
	let behaviorType = $state<CharacterBehaviorType>('use');
	let isSubmitting = $state(false);

	const selectedCondition = $derived(conditions.find((b) => b.id === conditionId));
	const selectedConditionName = $derived(selectedCondition?.name ?? '컨디션 선택');
	const selectedTypeName = $derived(getCharacterBehaviorTypeLabel(behaviorType));

	$effect(() => {
		if (open) {
			name = '';
			conditionId = undefined;
			behaviorType = 'use';
		}
	});

	function onConditionChange(value: string | undefined) {
		conditionId = value || undefined;
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
		if (!conditionId || isSubmitting) return;

		isSubmitting = true;

		admin
			.create({
				name: name.trim(),
				condition_id: conditionId as ConditionId,
				character_behavior_type: behaviorType,
			})
			.then((behavior) => {
				closeDialog();
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
						<ButtonGroupText>컨디션</ButtonGroupText>
						<Select type="single" value={conditionId ?? ''} onValueChange={onConditionChange}>
							<SelectTrigger class="flex-1">
								{selectedConditionName}
							</SelectTrigger>
							<SelectContent>
								{#each conditions as condition (condition.id)}
									<SelectItem value={condition.id}>{condition.name}</SelectItem>
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
					<InputGroupInput placeholder="이름" bind:value={name} />
				</InputGroup>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !conditionId}>
					{isSubmitting ? '생성 중...' : '생성하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
