<script lang="ts">
	import { useBehavior, useBuilding, useCharacter, useInteraction, useItem } from '$lib/hooks';
	import { Panel, useNodes } from '@xyflow/svelte';
	import type {
		ConditionBehaviorAction,
		BehaviorActionType,
		TargetSelectionMethod,
		BuildingInteractionId,
		ItemInteractionId,
		CharacterInteractionId,
		ConditionFulfillmentId,
		ConditionFulfillment,
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
	import { createConditionBehaviorActionNodeId } from '$lib/utils/flow-id';
	import { getBehaviorInteractTypeLabel } from '$lib/utils/state-label';
	import { BehaviorIdUtils } from '$lib/utils/behavior-id';
	import { clone } from 'radash';

	interface Props {
		action: ConditionBehaviorAction | undefined;
		hasParent?: boolean;
	}

	let { action, hasParent = false }: Props = $props();

	const { conditionBehaviorActionStore, searchEntitySources, admin } = useBehavior();
	const { buildingStore, conditionFulfillmentStore } = useBuilding();
	const { characterStore } = useCharacter();
	const { itemStore } = useItem();
	const { buildingInteractionStore, characterInteractionStore, itemInteractionStore } =
		useInteraction();
	const flowNodes = useNodes();

	const buildingInteractions = $derived(
		Object.values($buildingInteractionStore.data).filter((i) => i.system_interaction_type === null)
	);
	const itemInteractions = $derived(
		Object.values($itemInteractionStore.data).filter((i) => i.system_interaction_type === null)
	);
	const characterInteractions = $derived(
		Object.values($characterInteractionStore.data).filter((i) => i.system_interaction_type === null)
	);

	// 상호작용 가능한 엔티티 템플릿 (search 모드용)
	const interactableEntityTemplates = $derived.by(() => {
		if (!changes || changes.target_selection_method !== 'search') return [];
		return searchEntitySources(BehaviorIdUtils.to(changes));
	});

	const actionTypes: { value: BehaviorActionType; label: string }[] = [
		{ value: 'once', label: '한번 실행' },
		{ value: 'fulfill', label: '반복 실행' },
		{ value: 'idle', label: '대기' },
	];

	let isUpdating = $state(false);
	let changes = $state<ConditionBehaviorAction | undefined>(undefined);
	let currentActionId = $state<string | undefined>(undefined);

	const selectedTypeLabel = $derived(
		actionTypes.find((t) => t.value === changes?.type)?.label ?? '액션 타입'
	);

	const selectedTargetMethodLabel = $derived.by(() => {
		if (!changes) return '타깃 결정 방법';
		const c = changes; // Explicitly narrow type
		if (c.target_selection_method === 'search') return '새로운 탐색 대상';
		if (c.target_selection_method === 'explicit') {
			// Interaction 이름 표시
			if (c.building_interaction_id) {
				const interaction = buildingInteractions.find((i) => i.id === c.building_interaction_id);
				if (interaction) {
					const building = $buildingStore.data[interaction.building_id];
					const interactionType =
						interaction.once_interaction_type || interaction.fulfill_interaction_type;
					return `${building?.name ?? '건물'} - ${getBehaviorInteractTypeLabel(interactionType!)}`;
				}
			}
			if (c.item_interaction_id) {
				const interaction = itemInteractions.find((i) => i.id === c.item_interaction_id);
				if (interaction) {
					const item = $itemStore.data[interaction.item_id];
					const interactionType =
						interaction.once_interaction_type || interaction.fulfill_interaction_type;
					return `${item?.name ?? '아이템'} - ${getBehaviorInteractTypeLabel(interactionType!)}`;
				}
			}
			if (c.character_interaction_id) {
				const interaction = characterInteractions.find((i) => i.id === c.character_interaction_id);
				if (interaction) {
					const character = $characterStore.data[interaction.target_character_id];
					const interactionType =
						interaction.once_interaction_type || interaction.fulfill_interaction_type;
					return `${character?.name ?? '캐릭터'} - ${getBehaviorInteractTypeLabel(interactionType!)}`;
				}
			}
			return '지정된 대상';
		}
		return '타깃 결정 방법';
	});

	// 현재 선택된 대상의 value 값 (Select의 value prop에 사용)
	const selectedTargetValue = $derived.by(() => {
		if (!changes) return undefined;
		if (changes.target_selection_method === 'search') return 'search';
		if (changes.target_selection_method === 'explicit') {
			if (changes.building_interaction_id) return `building:${changes.building_interaction_id}`;
			if (changes.item_interaction_id) return `item:${changes.item_interaction_id}`;
			if (changes.character_interaction_id) return `character:${changes.character_interaction_id}`;
		}
		return undefined;
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

		// "building:id" 또는 "search" 형식 파싱
		if (
			value.startsWith('building:') ||
			value.startsWith('item:') ||
			value.startsWith('character:')
		) {
			const [entityType, entityId] = value.split(':');

			changes.target_selection_method = 'explicit';
			changes.building_interaction_id = null;
			changes.item_interaction_id = null;
			changes.character_interaction_id = null;

			if (entityType === 'building' && entityId) {
				changes.building_interaction_id = entityId as BuildingInteractionId;
			} else if (entityType === 'item' && entityId) {
				changes.item_interaction_id = entityId as ItemInteractionId;
			} else if (entityType === 'character' && entityId) {
				changes.character_interaction_id = entityId as CharacterInteractionId;
			}
		} else {
			changes.target_selection_method = value as TargetSelectionMethod;
			// search 모드로 변경 시 명시적 타깃 제거
			changes.building_interaction_id = null;
			changes.item_interaction_id = null;
			changes.character_interaction_id = null;
		}
	}

	async function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!changes || isUpdating) return;

		const actionId = changes.id;
		const conditionId = changes.condition_id;
		isUpdating = true;

		try {
			// root로 설정할 때 다른 root 액션들을 먼저 해제
			if (changes.root) {
				const allActions = Object.values($conditionBehaviorActionStore.data);
				const otherRootActions = allActions.filter(
					(a) => a.condition_id === conditionId && a.id !== actionId && a.root
				);
				await Promise.all(
					otherRootActions.map((a) => admin.updateConditionBehaviorAction(a.id, { root: false }))
				);
			}

			await admin.updateConditionBehaviorAction(actionId, {
				type: changes.type,
				target_selection_method: changes.target_selection_method,
				building_interaction_id: changes.building_interaction_id,
				item_interaction_id: changes.item_interaction_id,
				character_interaction_id: changes.character_interaction_id,
				condition_fulfillment_id: changes.condition_fulfillment_id,
				idle_duration_ticks: changes.idle_duration_ticks,
				root: changes.root,
			});
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
						<!-- 액션 타입 -->
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

						<!-- interact 타입: Interaction 선택 -->
						{#if changes.type === 'once'}
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

										{#if buildingInteractions.length > 0}
											<SelectGroup>
												<SelectLabel>건물 상호작용</SelectLabel>
												{#each buildingInteractions.filter((i) => i.once_interaction_type !== null) as interaction (interaction.id)}
													{@const building = $buildingStore.data[interaction.building_id]}
													{@const interactionType = interaction.once_interaction_type}
													<SelectItem value={`building:${interaction.id}`}>
														{building?.name ?? '건물'} - {getBehaviorInteractTypeLabel(
															interactionType!
														)}
													</SelectItem>
												{/each}
											</SelectGroup>
										{/if}

										{#if itemInteractions.length > 0}
											<SelectGroup>
												<SelectLabel>아이템 상호작용</SelectLabel>
												{#each itemInteractions.filter((i) => i.once_interaction_type !== null) as interaction (interaction.id)}
													{@const item = $itemStore.data[interaction.item_id]}
													{@const interactionType = interaction.once_interaction_type}
													<SelectItem value={`item:${interaction.id}`}>
														{item?.name ?? '아이템'} - {getBehaviorInteractTypeLabel(
															interactionType!
														)}
													</SelectItem>
												{/each}
											</SelectGroup>
										{/if}

										{#if characterInteractions.length > 0}
											<SelectGroup>
												<SelectLabel>캐릭터 상호작용</SelectLabel>
												{#each characterInteractions.filter((i) => i.once_interaction_type !== null) as interaction (interaction.id)}
													{@const character = $characterStore.data[interaction.target_character_id]}
													{@const interactionType = interaction.once_interaction_type}
													<SelectItem value={`character:${interaction.id}`}>
														{character?.name ?? '캐릭터'} - {getBehaviorInteractTypeLabel(
															interactionType!
														)}
													</SelectItem>
												{/each}
											</SelectGroup>
										{/if}
									</SelectContent>
								</Select>
							</ButtonGroup>
						{/if}

						<!-- fulfill 타입: Interaction 선택 -->
						{#if changes.type === 'fulfill'}
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

										{#if buildingInteractions.length > 0}
											<SelectGroup>
												<SelectLabel>건물 상호작용</SelectLabel>
												{#each buildingInteractions.filter((i) => i.fulfill_interaction_type !== null) as interaction (interaction.id)}
													{@const building = $buildingStore.data[interaction.building_id]}
													{@const interactionType = interaction.fulfill_interaction_type}
													<SelectItem value={`building:${interaction.id}`}>
														{building?.name ?? '건물'} - {getBehaviorInteractTypeLabel(
															interactionType!
														)}
													</SelectItem>
												{/each}
											</SelectGroup>
										{/if}

										{#if itemInteractions.length > 0}
											<SelectGroup>
												<SelectLabel>아이템 상호작용</SelectLabel>
												{#each itemInteractions.filter((i) => i.fulfill_interaction_type !== null) as interaction (interaction.id)}
													{@const item = $itemStore.data[interaction.item_id]}
													{@const interactionType = interaction.fulfill_interaction_type}
													<SelectItem value={`item:${interaction.id}`}>
														{item?.name ?? '아이템'} - {getBehaviorInteractTypeLabel(
															interactionType!
														)}
													</SelectItem>
												{/each}
											</SelectGroup>
										{/if}

										{#if characterInteractions.length > 0}
											<SelectGroup>
												<SelectLabel>캐릭터 상호작용</SelectLabel>
												{#each characterInteractions.filter((i) => i.fulfill_interaction_type !== null) as interaction (interaction.id)}
													{@const character = $characterStore.data[interaction.target_character_id]}
													{@const interactionType = interaction.fulfill_interaction_type}
													<SelectItem value={`character:${interaction.id}`}>
														{character?.name ?? '캐릭터'} - {getBehaviorInteractTypeLabel(
															interactionType!
														)}
													</SelectItem>
												{/each}
											</SelectGroup>
										{/if}
									</SelectContent>
								</Select>
							</ButtonGroup>
						{/if}

						<!-- search 모드일 때 검색 가능한 대상 표시 -->
						{#if (changes.type === 'once' || changes.type === 'fulfill') && changes.target_selection_method === 'search'}
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

						<!-- idle 타입: 지속 시간 -->
						{#if changes.type === 'idle'}
							<InputGroup>
								<InputGroupAddon align="inline-start">
									<Tooltip>
										<TooltipTrigger>
											<InputGroupButton>대기 시간 (틱)</InputGroupButton>
										</TooltipTrigger>
										<TooltipContent>대기 시간을 설정합니다.</TooltipContent>
									</Tooltip>
								</InputGroupAddon>
								<InputGroupInput
									type="number"
									step="1"
									min="0"
									placeholder="숫자 입력"
									bind:value={changes.idle_duration_ticks}
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
