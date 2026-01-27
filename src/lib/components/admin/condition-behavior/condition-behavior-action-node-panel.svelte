<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type {
		ConditionBehaviorAction,
		BehaviorActionType,
		BehaviorTargetSelectionMethod,
		BehaviorInteractType,
		BehaviorCompletionType,
		CharacterId,
		BuildingId,
		ItemId,
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
	import {
		Select,
		SelectTrigger,
		SelectContent,
		SelectItem,
		SelectGroup,
		SelectLabel,
	} from '$lib/components/ui/select';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { useBehavior } from '$lib/hooks/use-behavior';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useItem } from '$lib/hooks/use-item';
	import { createConditionBehaviorActionNodeId } from '$lib/utils/flow-id';
	import {
		getBehaviorInteractTypeOptions,
		getBehaviorCompletionTypeOptions,
	} from '$lib/utils/state-label';
	import { clone } from 'radash';

	interface Props {
		action: ConditionBehaviorAction | undefined;
		hasParent?: boolean;
	}

	let { action, hasParent = false }: Props = $props();

	const { conditionBehaviorActionStore, getInteractableEntityTemplates, admin } = useBehavior();
	const { buildingStore } = useBuilding();
	const { characterStore } = useCharacter();
	const { itemStore } = useItem();
	const flowNodes = useNodes();

	const buildings = $derived(Object.values($buildingStore.data));
	const characters = $derived(Object.values($characterStore.data));
	const items = $derived(Object.values($itemStore.data));

	const actionTypes: { value: BehaviorActionType; label: string }[] = [
		{ value: 'go', label: '이동' },
		{ value: 'interact', label: '상호작용' },
		{ value: 'idle', label: '대기' },
	];

	const behaviorTypes = getBehaviorInteractTypeOptions();
	const completionTypes = getBehaviorCompletionTypeOptions();

	let isUpdating = $state(false);
	let changes = $state<ConditionBehaviorAction | undefined>(undefined);
	let currentActionId = $state<string | undefined>(undefined);

	const selectedTypeLabel = $derived(
		actionTypes.find((t) => t.value === changes?.type)?.label ?? '액션 타입'
	);
	const selectedTargetMethodLabel = $derived.by(() => {
		if (!changes) return '타깃 결정 방법';

		if (changes.target_selection_method === 'search') return '새로운 탐색 대상';
		if (changes.target_selection_method === 'search_or_continue') return '기존 선택 대상';

		// explicit인 경우 선택된 엔티티 이름 표시
		if (changes.target_selection_method === 'explicit') {
			if (changes?.building_id) {
				const building = buildings.find((b) => b.id === changes?.building_id);
				return building ? building.name : '지정된 대상';
			}
			if (changes?.item_id) {
				const item = items.find((i) => i.id === changes?.item_id);
				return item ? item.name : '지정된 대상';
			}
			return '지정된 대상';
		}

		return '타깃 결정 방법';
	});
	const selectedBehaviorTypeLabel = $derived(
		behaviorTypes.find((t) => t.value === changes?.behavior_interact_type)?.label ?? '행동 타입'
	);
	const selectedCompletionTypeLabel = $derived(
		completionTypes.find((t) => t.value === changes?.behavior_completion_type)?.label ?? '종료'
	);
	// 현재 선택된 대상의 value 값 (Select의 value prop에 사용)
	const selectedTargetValue = $derived.by(() => {
		if (!changes) return undefined;

		if (changes.target_selection_method === 'search') return 'search';
		if (changes.target_selection_method === 'search_or_continue') return 'search_or_continue';

		// explicit인 경우
		if (changes.target_selection_method === 'explicit') {
			if (changes.building_id) return `explicit:building:${changes.building_id}`;
			if (changes.item_id) return `explicit:item:${changes.item_id}`;
		}

		return undefined;
	});

	// 현재 액션의 behavior_interact_type에 따라 검색 가능한 대상
	const interactableEntityTemplates = $derived.by(() => {
		if (!changes || changes.target_selection_method !== 'search') return [];
		return getInteractableEntityTemplates(changes);
	});

	// 현재 액션의 behavior_interact_type에 따라 명시적으로 선택 가능한 대상
	// 지정된 대상(explicit)은 fulfillment 조건 없이 모든 엔티티 선택 가능
	const explicitTargets = $derived.by(() => {
		if (!changes) return [];
		const type = changes.behavior_interact_type;

		if (type.startsWith('building_')) {
			return buildings.map((b) => ({ id: b.id, name: b.name, type: 'building' as const }));
		} else if (type.startsWith('item_')) {
			return items.map((i) => ({ id: i.id, name: i.name, type: 'item' as const }));
		}
		return [];
	});

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

	function onTargetMethodChange(value: string | undefined) {
		if (!changes || !value) return;

		// "explicit:building:id" 또는 "search" 형식 파싱
		if (value.startsWith('explicit:')) {
			const parts = value.split(':');
			const entityType = parts[1];
			const entityId = parts[2];

			changes.target_selection_method = 'explicit';
			changes.building_id = null;
			changes.character_id = null;
			changes.item_id = null;

			if (entityType === 'building' && entityId) {
				changes.building_id = entityId as BuildingId;
			} else if (entityType === 'item' && entityId) {
				changes.item_id = entityId as ItemId;
			}
		} else {
			changes.target_selection_method = value as BehaviorTargetSelectionMethod;
			// search 모드로 변경 시 명시적 타깃 제거
			changes.building_id = null;
			changes.character_id = null;
			changes.item_id = null;
		}
	}

	function onBehaviorTypeChange(value: string | undefined) {
		if (changes && value) {
			changes.behavior_interact_type = value as BehaviorInteractType;
		}
	}

	function onCompletionTypeChange(value: string | undefined) {
		if (changes && value) {
			changes.behavior_completion_type = value as BehaviorCompletionType;
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
				behavior_interact_type: changes.behavior_interact_type,
				target_selection_method: changes.target_selection_method,
				behavior_completion_type: changes.behavior_completion_type,
				duration_ticks: changes.duration_ticks,
				building_id: changes.building_id,
				character_id: changes.character_id,
				item_id: changes.item_id,
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

						{#if changes.type === 'go' || changes.type === 'interact'}
							<ButtonGroup class="w-full">
								<ButtonGroupText>상호작용</ButtonGroupText>
								<Select
									type="single"
									value={changes.behavior_interact_type}
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

						{#if changes.type === 'go' || changes.type === 'interact'}
							<ButtonGroup class="w-full">
								<ButtonGroupText>대상</ButtonGroupText>
								<Select
									type="single"
									value={selectedTargetValue}
									onValueChange={onTargetMethodChange}
								>
									<SelectTrigger class="flex-1">
										{selectedTargetMethodLabel}
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="search">새로운 탐색 대상</SelectItem>
										<SelectItem value="search_or_continue">기존 선택 대상</SelectItem>

										<SelectGroup>
											<SelectLabel>지정된 대상</SelectLabel>
											{#each explicitTargets as target (target.id)}
												<SelectItem value={`explicit:${target.type}:${target.id}`}>
													{target.name}
												</SelectItem>
											{/each}
										</SelectGroup>
									</SelectContent>
								</Select>
							</ButtonGroup>
						{/if}

						{#if (changes.type === 'go' || changes.type === 'interact') && changes.target_selection_method === 'search'}
							<div class="px-2 text-right text-xs">
								{#if interactableEntityTemplates.length > 0}
									<div class="text-xs">
										{interactableEntityTemplates.map(({ name }) => name).join(', ')}
									</div>
								{:else}
									<div class="text-xs text-muted-foreground">해당 타입의 대상이 없습니다.</div>
								{/if}
							</div>
						{/if}
						{#if changes.type === 'interact' || changes.type === 'idle'}
							<ButtonGroup class="w-full">
								<ButtonGroupText>종료</ButtonGroupText>
								<Select
									type="single"
									value={changes.behavior_completion_type}
									onValueChange={onCompletionTypeChange}
								>
									<SelectTrigger class="flex-1">
										{selectedCompletionTypeLabel}
									</SelectTrigger>
									<SelectContent>
										{#each completionTypes as completionType}
											<SelectItem value={completionType.value}>
												{completionType.label}
											</SelectItem>
										{/each}
									</SelectContent>
								</Select>
							</ButtonGroup>
						{/if}
						{#if (changes.type === 'idle' || changes.type === 'interact') && changes.behavior_completion_type === 'fixed'}
							<InputGroup>
								<InputGroupAddon align="inline-start">
									<Tooltip>
										<TooltipTrigger>
											<InputGroupButton>지속 시간(틱)</InputGroupButton>
										</TooltipTrigger>
										<TooltipContent>
											{#if changes.type === 'idle'}
												대기 시간을 설정합니다.
											{:else}
												고정 시간만큼 상호작용을 실행합니다.
											{/if}
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
