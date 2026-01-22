<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type {
		ConditionBehaviorAction,
		BehaviorActionType,
		CharacterBehaviorType,
	} from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import { IconCircleDashedNumber1 } from '@tabler/icons-svelte';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { useBehavior } from '$lib/hooks/use-behavior';
	import { createConditionBehaviorActionNodeId } from '$lib/utils/flow-id';
	import { getCharacterBehaviorTypeLabel } from '$lib/utils/state-label';
	import { clone } from 'radash';

	interface Props {
		action: ConditionBehaviorAction | undefined;
		hasParent?: boolean;
	}

	let { action, hasParent = false }: Props = $props();

	const { conditionBehaviorActionStore, admin } = useBehavior();
	const flowNodes = useNodes();

	const actionTypes: { value: BehaviorActionType; label: string }[] = [
		{ value: 'go', label: '이동' },
		{ value: 'interact', label: '상호작용' },
		{ value: 'idle', label: '대기' },
	];

	const behaviorTypes: { value: CharacterBehaviorType; label: string }[] = [
		{ value: 'use', label: '사용' },
		{ value: 'repair', label: '수리' },
		{ value: 'demolish', label: '철거' },
		{ value: 'clean', label: '청소' },
		{ value: 'pick', label: '줍기' },
	];

	let isUpdating = $state(false);
	let changes = $state<ConditionBehaviorAction | undefined>(undefined);
	let currentActionId = $state<string | undefined>(undefined);

	const selectedTypeLabel = $derived(
		actionTypes.find((t) => t.value === changes?.type)?.label ?? '액션 타입'
	);
	const selectedBehaviorTypeLabel = $derived(
		changes?.character_behavior_type
			? getCharacterBehaviorTypeLabel(changes.character_behavior_type)
			: '행동 타입'
	);

	$effect(() => {
		if (action && action.id !== currentActionId) {
			currentActionId = action.id;
			changes = clone(action);
		}
	});

	function onTypeChange(value: string | undefined) {
		if (changes && value) {
			changes.type = value as BehaviorActionType;
		}
	}

	function onBehaviorTypeChange(value: string | undefined) {
		if (changes) {
			changes.character_behavior_type = (value as CharacterBehaviorType) || null;
		}
	}

	async function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!changes || isUpdating) return;

		const actionId = changes.id;
		const behaviorId = changes.condition_behavior_id;
		isUpdating = true;

		try {
			// root로 설정할 때 다른 root 액션들을 먼저 해제
			if (changes.root) {
				const allActions = Object.values($conditionBehaviorActionStore.data);
				const otherRootActions = allActions.filter(
					(a) => a.condition_behavior_id === behaviorId && a.id !== actionId && a.root
				);
				await Promise.all(
					otherRootActions.map((a) => admin.updateConditionBehaviorAction(a.id, { root: false }))
				);
			}

			await admin.updateConditionBehaviorAction(actionId, {
				type: changes.type,
				character_behavior_type: changes.character_behavior_type,
				duration_ticks: changes.duration_ticks,
				root: changes.root,
			});

			// 선택 해제
			const nodeId = `condition-behavior-action-${actionId}`;
			flowNodes.update((ns) => ns.map((n) => (n.id === nodeId ? { ...n, selected: false } : n)));
		} catch (error) {
			console.error('Failed to update action:', error);
		} finally {
			isUpdating = false;
		}
	}

	function onclickCancel() {
		if (!action) return;

		flowNodes.update((ns) =>
			ns.map((n) =>
				n.id === createConditionBehaviorActionNodeId(action) ? { ...n, selected: false } : n
			)
		);
	}
</script>

<Panel position="top-right">
	<Card class="w-80 py-4">
		<CardContent class="px-4">
			{#if changes}
				<form {onsubmit} class="space-y-4">
					<div class="space-y-2">
						<ButtonGroup class="w-full">
							<ButtonGroupText>행동</ButtonGroupText>
							<Select type="single" value={changes.type} onValueChange={onTypeChange}>
								<SelectTrigger class="flex-1">
									{selectedTypeLabel}
								</SelectTrigger>
								<SelectContent>
									{#each actionTypes as actionType (actionType.value)}
										<SelectItem value={actionType.value}>{actionType.label}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</ButtonGroup>

						{#if changes.type === 'interact'}
							<ButtonGroup class="w-full">
								<ButtonGroupText>상호작용</ButtonGroupText>
								<Select
									type="single"
									value={changes.character_behavior_type ?? ''}
									onValueChange={onBehaviorTypeChange}
								>
									<SelectTrigger class="flex-1">
										{selectedBehaviorTypeLabel}
									</SelectTrigger>
									<SelectContent>
										{#each behaviorTypes as behaviorType (behaviorType.value)}
											<SelectItem value={behaviorType.value}>{behaviorType.label}</SelectItem>
										{/each}
									</SelectContent>
								</Select>
							</ButtonGroup>
						{/if}

						{#if changes.type === 'idle'}
							<InputGroup>
								<InputGroupAddon align="inline-start">
									<Tooltip>
										<TooltipTrigger>
											<InputGroupButton>지속 시간(틱)</InputGroupButton>
										</TooltipTrigger>
										<TooltipContent>
											대기에서만 사용할 수 있습니다. 0이면 즉시 다음 액션으로 넘어갑니다.
										</TooltipContent>
									</Tooltip>
								</InputGroupAddon>
								<InputGroupInput
									type="number"
									step="1"
									min="0"
									placeholder="숫자 입력"
									bind:value={changes.duration_ticks}
								/>
							</InputGroup>
						{/if}
					</div>
					<div class="flex justify-between">
						<Tooltip>
							<TooltipTrigger>
								{#snippet child({ props })}
									<Button
										{...props}
										type="button"
										variant={changes?.root ? 'secondary' : 'ghost'}
										size="icon"
										aria-label="시작 액션으로 지정"
										onclick={() => {
											if (changes && !hasParent) changes.root = !changes.root;
										}}
										disabled={hasParent}
									>
										<IconCircleDashedNumber1 />
									</Button>
								{/snippet}
							</TooltipTrigger>
							<TooltipContent>시작 액션으로 지정</TooltipContent>
						</Tooltip>
						<div class="flex gap-2">
							<Button type="button" variant="outline" onclick={onclickCancel} disabled={isUpdating}>
								취소
							</Button>
							<Button type="submit" disabled={isUpdating}>
								{isUpdating ? '저장 중...' : '저장'}
							</Button>
						</div>
					</div>
				</form>
			{/if}
		</CardContent>
	</Card>
</Panel>
