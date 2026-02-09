<script lang="ts">
	import { useBuilding, useCharacter, useInteraction } from '$lib/hooks';
	import { Panel, useNodes } from '@xyflow/svelte';
	import type {
		ConditionFulfillment,
		ConditionFulfillmentType,
		BuildingInteractionId,
	} from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import {
		getFallbackString,
		getBehaviorInteractTypeString,
		getActionString,
		getDomainString,
		getFulfillmentTargetLabelString,
	} from '$lib/utils/label';
	import { clone } from 'radash';

	interface Props {
		fulfillment: ConditionFulfillment | undefined;
	}

	let { fulfillment }: Props = $props();

	const { buildingStore, admin } = useBuilding();
	const { characterStore } = useCharacter();
	const { buildingInteractionStore } = useInteraction();
	const flowNodes = useNodes();

	const buildings = $derived(Object.values($buildingStore.data));
	const characters = $derived(Object.values($characterStore.data));
	const buildingInteractions = $derived(Object.values($buildingInteractionStore.data));

	function getTypeLabel(type: ConditionFulfillmentType) {
		return getDomainString(type);
	}

	let isUpdating = $state(false);
	let changes = $state<ConditionFulfillment | undefined>(undefined);
	let currentFulfillmentId = $state<string | undefined>(undefined);

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
			.updateConditionFulfillment(fulfillmentId, {
				fulfillment_type: changes.fulfillment_type,
				building_interaction_id: changes.building_interaction_id,
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
			ns.map((n) =>
				n.id === `condition-fulfillment-${fulfillment.id}` ? { ...n, selected: false } : n
			)
		);
	}

	function onTypeChange(value: string | undefined) {
		if (value && changes) {
			changes.fulfillment_type = value as ConditionFulfillmentType;
			// 타입 변경 시 대상 ID 초기화
			changes.building_interaction_id = null;
		}
	}

	function onTargetChange(value: string | undefined) {
		if (!changes) return;
		const id = value && value !== '' ? value : null;
		if (changes.fulfillment_type === 'building') {
			changes.building_interaction_id = id as BuildingInteractionId | null;
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
					interaction.once_interaction_type || interaction.fulfill_interaction_type;
				const behaviorLabel = interactionType ? getBehaviorInteractTypeString(interactionType) : '';
				const characterName = character ? character.name : getFallbackString('allCharacters');
				return {
					id: interaction.id,
					name: `${buildingName} - ${characterName} ${behaviorLabel}`,
				};
			});
		}
		return [];
	});

	const selectedTargetId = $derived.by(() => {
		if (changes?.fulfillment_type === 'building') return changes.building_interaction_id;
		return undefined;
	});

	const hasTargetSelector = $derived(changes?.fulfillment_type === 'building');
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
									<SelectItem value="building">{getDomainString('building')}</SelectItem>
								</SelectContent>
							</Select>
						</ButtonGroup>

						{#if hasTargetSelector}
							<ButtonGroup class="w-full">
								<ButtonGroupText>상호작용</ButtonGroupText>
								<Select type="single" value={selectedTargetId ?? ''} onValueChange={onTargetChange}>
									<SelectTrigger class="flex-1">
										{#if getFulfillmentTargetLabelString(changes).length > 15}
											{getFulfillmentTargetLabelString(changes).substring(0, 15) + '...'}
										{:else}
											{getFulfillmentTargetLabelString(changes)}
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

						<InputGroup>
							<InputGroupAddon align="inline-start">
								<Tooltip>
									<TooltipTrigger>
										{#snippet child({ props })}
											<InputGroupButton {...props} variant="ghost">틱당 증가</InputGroupButton>
										{/snippet}
									</TooltipTrigger>
									<TooltipContent side="bottom">
										조건 충족 수단 이용 시
										<br />
										틱당 증가하는 수치입니다
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
							{isUpdating ? getActionString('saving') : getActionString('save')}
						</Button>
					</div>
				</form>
			{/if}
		</CardContent>
	</Card>
</Panel>
