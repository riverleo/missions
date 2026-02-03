<script lang="ts">
	import { useBuilding, useCharacter, useItem } from '$lib/hooks';
	import { Panel, useNodes } from '@xyflow/svelte';
	import type {
		NeedFulfillment,
		NeedFulfillmentType,
		NeedFulfillmentTaskCondition,
		BuildingInteractionId,
		ItemInteractionId,
		CharacterInteractionId,
	} from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupButton,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuRadioGroup,
		DropdownMenuRadioItem,
		DropdownMenuTrigger,
	} from '$lib/components/ui/dropdown-menu';
	import { getBehaviorInteractTypeLabel } from '$lib/utils/state-label';
	import { clone } from 'radash';

	interface Props {
		fulfillment: NeedFulfillment | undefined;
	}

	let { fulfillment }: Props = $props();

	const { admin } = useCharacter();
	const { buildingStore, buildingInteractionStore } = useBuilding();
	const { characterStore, characterInteractionStore } = useCharacter();
	const { itemStore, itemInteractionStore } = useItem();
	const flowNodes = useNodes();

	const buildings = $derived(Object.values($buildingStore.data));
	const characters = $derived(Object.values($characterStore.data));
	const items = $derived(Object.values($itemStore.data));
	const buildingInteractions = $derived(Object.values($buildingInteractionStore.data));
	const characterInteractions = $derived(Object.values($characterInteractionStore.data));
	const itemInteractions = $derived(Object.values($itemInteractionStore.data));

	const fulfillmentTypeOptions: { value: NeedFulfillmentType; label: string }[] = [
		{ value: 'building', label: '건물' },
		{ value: 'character', label: '캐릭터' },
		{ value: 'item', label: '아이템' },
		{ value: 'task', label: '할 일' },
	];

	const taskConditionOptions: { value: NeedFulfillmentTaskCondition; label: string }[] = [
		{ value: 'completed', label: '완료' },
		{ value: 'created', label: '생성' },
	];

	function getTypeLabel(type: NeedFulfillmentType) {
		return fulfillmentTypeOptions.find((o) => o.value === type)?.label ?? type;
	}

	function getTaskConditionLabel(condition: NeedFulfillmentTaskCondition | null | undefined) {
		if (!condition) return '조건 선택';
		return taskConditionOptions.find((o) => o.value === condition)?.label ?? condition;
	}

	let isUpdating = $state(false);
	let changes = $state<NeedFulfillment | undefined>(undefined);
	let currentFulfillmentId = $state<string | undefined>(undefined);

	const selectedTargetLabel = $derived.by(() => {
		if (changes?.fulfillment_type === 'building' && changes?.building_interaction_id) {
			const interaction = buildingInteractions.find(
				(i) => i.id === changes?.building_interaction_id
			);
			if (interaction) {
				const building = buildings.find((b) => b.id === interaction.building_id);
				const character = interaction.character_id
					? characters.find((c) => c.id === interaction.character_id)
					: undefined;
				const interactionType =
					interaction.once_interaction_type || interaction.repeat_interaction_type;
				const behaviorLabel = interactionType ? getBehaviorInteractTypeLabel(interactionType) : '';
				const characterName = character ? character.name : '모든 캐릭터';
				return `${building?.name ?? '건물'} - ${characterName} ${behaviorLabel}`;
			}
		}
		if (changes?.fulfillment_type === 'character' && changes?.character_interaction_id) {
			const interaction = characterInteractions.find(
				(i) => i.id === changes?.character_interaction_id
			);
			if (interaction) {
				const targetCharacter = characters.find((c) => c.id === interaction.target_character_id);
				const character = interaction.character_id
					? characters.find((c) => c.id === interaction.character_id)
					: undefined;
				const interactionType =
					interaction.once_interaction_type || interaction.repeat_interaction_type;
				const behaviorLabel = interactionType ? getBehaviorInteractTypeLabel(interactionType) : '';
				const characterName = character ? character.name : '모든 캐릭터';
				return `${targetCharacter?.name ?? '캐릭터'} - ${characterName} ${behaviorLabel}`;
			}
		}
		if (changes?.fulfillment_type === 'item' && changes?.item_interaction_id) {
			const interaction = itemInteractions.find((i) => i.id === changes?.item_interaction_id);
			if (interaction) {
				const item = items.find((i) => i.id === interaction.item_id);
				const character = interaction.character_id
					? characters.find((c) => c.id === interaction.character_id)
					: undefined;
				const interactionType =
					interaction.once_interaction_type || interaction.repeat_interaction_type;
				const behaviorLabel = interactionType ? getBehaviorInteractTypeLabel(interactionType) : '';
				const characterName = character ? character.name : '모든 캐릭터';
				return `${item?.name ?? '아이템'} - ${characterName} ${behaviorLabel}`;
			}
		}
		return '상호작용 선택...';
	});

	$effect(() => {
		if (fulfillment && fulfillment.id !== currentFulfillmentId) {
			currentFulfillmentId = fulfillment.id;
			changes = clone(fulfillment);
		}
	});

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!changes || isUpdating) return;

		const fulfillmentId = changes.id;
		isUpdating = true;

		admin
			.updateNeedFulfillment(fulfillmentId, {
				fulfillment_type: changes.fulfillment_type,
				building_interaction_id:
					changes.fulfillment_type === 'building' ? changes.building_interaction_id : null,
				character_interaction_id:
					changes.fulfillment_type === 'character' ? changes.character_interaction_id : null,
				item_interaction_id:
					changes.fulfillment_type === 'item' ? changes.item_interaction_id : null,
				task_condition: changes.fulfillment_type === 'task' ? changes.task_condition : null,
				task_count: changes.fulfillment_type === 'task' ? changes.task_count : 1,
				task_duration_ticks: changes.fulfillment_type === 'task' ? changes.task_duration_ticks : 0,
				increase_per_tick: changes.increase_per_tick,
			})
			.then(() => {
				// 저장 성공
			})
			.catch((error: Error) => {
				console.error('Failed to update fulfillment:', error);
			})
			.finally(() => {
				isUpdating = false;
			});
	}

	function onclickCancel() {
		if (!fulfillment) return;

		flowNodes.update((ns) =>
			ns.map((n) => (n.id === `fulfillment-${fulfillment.id}` ? { ...n, selected: false } : n))
		);
	}

	function onTypeChange(value: string | undefined) {
		if (value && changes) {
			changes.fulfillment_type = value as NeedFulfillmentType;
			// 타입 변경 시 대상 ID 초기화
			changes.building_interaction_id = null;
			changes.character_interaction_id = null;
			changes.item_interaction_id = null;
			changes.task_condition = null;
		}
	}

	function onTaskConditionChange(value: string | undefined) {
		if (changes) {
			changes.task_condition = (value as NeedFulfillmentTaskCondition) || null;
		}
	}

	function onTargetChange(value: string | undefined) {
		if (!changes) return;
		const id = value && value !== '' ? value : null;
		if (changes.fulfillment_type === 'building') {
			changes.building_interaction_id = id as BuildingInteractionId | null;
		} else if (changes.fulfillment_type === 'character') {
			changes.character_interaction_id = id as CharacterInteractionId | null;
		} else if (changes.fulfillment_type === 'item') {
			changes.item_interaction_id = id as ItemInteractionId | null;
		}
	}

	const targetOptions = $derived.by(() => {
		if (changes?.fulfillment_type === 'building') {
			return buildingInteractions.map((interaction) => {
				const building = buildings.find((b) => b.id === interaction.building_id);
				const buildingName = building?.name ?? '기본';
				const character = interaction.character_id
					? characters.find((c) => c.id === interaction.character_id)
					: undefined;
				const interactionType =
					interaction.once_interaction_type || interaction.repeat_interaction_type;
				const behaviorLabel = interactionType ? getBehaviorInteractTypeLabel(interactionType) : '';
				const characterName = character ? character.name : '모든 캐릭터';
				return {
					id: interaction.id,
					name: `${buildingName} - ${characterName} ${behaviorLabel}`,
				};
			});
		}
		if (changes?.fulfillment_type === 'character') {
			return characterInteractions.map((interaction) => {
				const targetCharacter = characters.find((c) => c.id === interaction.target_character_id);
				const character = interaction.character_id
					? characters.find((c) => c.id === interaction.character_id)
					: undefined;
				const interactionType =
					interaction.once_interaction_type || interaction.repeat_interaction_type;
				const behaviorLabel = interactionType ? getBehaviorInteractTypeLabel(interactionType) : '';
				const characterName = character ? character.name : '모든 캐릭터';
				return {
					id: interaction.id,
					name: `${targetCharacter?.name ?? '캐릭터'} - ${characterName} ${behaviorLabel}`,
				};
			});
		}
		if (changes?.fulfillment_type === 'item') {
			return itemInteractions.map((interaction) => {
				const item = items.find((i) => i.id === interaction.item_id);
				const itemName = item?.name ?? '기본';
				const character = interaction.character_id
					? characters.find((c) => c.id === interaction.character_id)
					: undefined;
				const interactionType =
					interaction.once_interaction_type || interaction.repeat_interaction_type;
				const behaviorLabel = interactionType ? getBehaviorInteractTypeLabel(interactionType) : '';
				const characterName = character ? character.name : '모든 캐릭터';
				return {
					id: interaction.id,
					name: `${itemName} - ${characterName} ${behaviorLabel}`,
				};
			});
		}
		return [];
	});

	const selectedTargetId = $derived.by(() => {
		if (changes?.fulfillment_type === 'building') return changes.building_interaction_id;
		if (changes?.fulfillment_type === 'character') return changes.character_interaction_id;
		if (changes?.fulfillment_type === 'item') return changes.item_interaction_id;
		return undefined;
	});

	const hasTargetSelector = $derived(
		changes?.fulfillment_type === 'building' ||
			changes?.fulfillment_type === 'character' ||
			changes?.fulfillment_type === 'item'
	);
</script>

<Panel position="top-right">
	<Card class="w-80 py-4">
		<CardContent class="px-4">
			{#if changes}
				<form {onsubmit} class="space-y-4">
					<div class="space-y-2">
						<ButtonGroup class="w-full">
							<ButtonGroupText>타입</ButtonGroupText>
							<Select type="single" value={changes.fulfillment_type} onValueChange={onTypeChange}>
								<SelectTrigger class="flex-1">
									{getTypeLabel(changes.fulfillment_type)}
								</SelectTrigger>
								<SelectContent>
									{#each fulfillmentTypeOptions as option (option.value)}
										<SelectItem value={option.value}>{option.label}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</ButtonGroup>

						{#if hasTargetSelector}
							<ButtonGroup class="w-full">
								<ButtonGroupText>상호작용</ButtonGroupText>
								<Select type="single" value={selectedTargetId ?? ''} onValueChange={onTargetChange}>
									<SelectTrigger class="flex-1">
										{#if selectedTargetLabel.length > 15}
											{selectedTargetLabel.substring(0, 15) + '...'}
										{:else}
											{selectedTargetLabel}
										{/if}
									</SelectTrigger>
									<SelectContent>
										{#each targetOptions as option (option.id)}
											<SelectItem value={option.id}>{option.name}</SelectItem>
										{/each}
									</SelectContent>
								</Select>
							</ButtonGroup>
						{/if}

						{#if changes.fulfillment_type === 'task'}
							<InputGroup>
								<InputGroupAddon align="inline-start">
									<InputGroupText>할 일</InputGroupText>
								</InputGroupAddon>
								<InputGroupInput type="number" min="1" bind:value={changes.task_count} />
								<InputGroupAddon align="inline-end">
									<InputGroupText>개</InputGroupText>
									<DropdownMenu>
										<DropdownMenuTrigger>
											{#snippet child({ props })}
												<InputGroupButton {...props} variant="ghost">
													{getTaskConditionLabel(changes?.task_condition)}
												</InputGroupButton>
											{/snippet}
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuRadioGroup
												value={changes.task_condition ?? ''}
												onValueChange={onTaskConditionChange}
											>
												{#each taskConditionOptions as option (option.value)}
													<DropdownMenuRadioItem value={option.value}>
														{option.label}
													</DropdownMenuRadioItem>
												{/each}
											</DropdownMenuRadioGroup>
										</DropdownMenuContent>
									</DropdownMenu>
								</InputGroupAddon>
							</InputGroup>
							<InputGroup>
								<InputGroupAddon align="inline-start">
									<InputGroupText>지속 시간(틱)</InputGroupText>
								</InputGroupAddon>
								<InputGroupInput
									type="number"
									step="1"
									min="0"
									bind:value={changes.task_duration_ticks}
								/>
							</InputGroup>
						{/if}

						<InputGroup>
							<InputGroupAddon align="inline-start">
								<Tooltip>
									<TooltipTrigger>
										{#snippet child({ props })}
											<InputGroupButton {...props} variant="ghost">틱당 증가</InputGroupButton>
										{/snippet}
									</TooltipTrigger>
									<TooltipContent side="bottom">
										캐릭터가 이 충족 수단을 이용할 때
										<br />
										틱당 증가하는 욕구 수치입니다
									</TooltipContent>
								</Tooltip>
							</InputGroupAddon>
							<InputGroupInput type="number" step="0.1" bind:value={changes.increase_per_tick} />
						</InputGroup>
					</div>
					<div class="flex justify-end gap-2">
						<Button type="button" variant="outline" onclick={onclickCancel} disabled={isUpdating}>
							취소
						</Button>
						<Button type="submit" disabled={isUpdating}>
							{isUpdating ? '저장 중...' : '저장'}
						</Button>
					</div>
				</form>
			{/if}
		</CardContent>
	</Card>
</Panel>
