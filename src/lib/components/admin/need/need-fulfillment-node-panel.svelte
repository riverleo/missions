<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type { NeedFulfillment, NeedFulfillmentType } from '$lib/types';
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
	import { useNeed } from '$lib/hooks/use-need';
	import { useBuilding } from '$lib/hooks/use-building';
	import { IconCategory } from '@tabler/icons-svelte';
	import { clone } from 'radash';

	interface Props {
		fulfillment: NeedFulfillment | undefined;
	}

	let { fulfillment }: Props = $props();

	const { admin } = useNeed();
	const { store: buildingStore } = useBuilding();
	const flowNodes = useNodes();

	const buildings = $derived(Object.values($buildingStore.data));

	const fulfillmentTypeOptions: { value: NeedFulfillmentType; label: string }[] = [
		{ value: 'building', label: '건물' },
		{ value: 'task', label: '할 일' },
		{ value: 'item', label: '아이템' },
		{ value: 'idle', label: '대기' },
	];

	function getTypeLabel(type: NeedFulfillmentType) {
		return fulfillmentTypeOptions.find((o) => o.value === type)?.label ?? type;
	}

	let isUpdating = $state(false);
	let changes = $state<NeedFulfillment | undefined>(undefined);
	let currentFulfillmentId = $state<string | undefined>(undefined);

	const selectedBuildingName = $derived(
		buildings.find((b) => b.id === changes?.building_id)?.name ?? '선택...'
	);

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
				building_id: changes.fulfillment_type === 'building' ? changes.building_id : null,
				increase_per_tick: changes.increase_per_tick,
			})
			.then(() => {
				// 선택 해제
				flowNodes.update((ns) =>
					ns.map((n) => (n.id === `fulfillment-${fulfillmentId}` ? { ...n, selected: false } : n))
				);
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
		}
	}

	function onBuildingChange(value: string | undefined) {
		if (changes) {
			changes.building_id = value ?? null;
		}
	}
</script>

<Panel position="top-right">
	<Card class="w-80 py-4">
		<CardContent class="px-4">
			{#if changes}
				<form {onsubmit} class="space-y-4">
					<div class="space-y-2">
						<ButtonGroup class="w-full">
							<ButtonGroup class="w-full">
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

							<ButtonGroup class="w-full">
								<Select
									type="single"
									value={changes.building_id ?? undefined}
									onValueChange={onBuildingChange}
									disabled={changes.fulfillment_type !== 'building'}
								>
									<SelectTrigger class="flex-1">
										{selectedBuildingName}
									</SelectTrigger>
									<SelectContent>
										{#each buildings as building (building.id)}
											<SelectItem value={building.id}>{building.name}</SelectItem>
										{/each}
									</SelectContent>
								</Select>
							</ButtonGroup>
						</ButtonGroup>

						<InputGroup>
							<InputGroupAddon align="inline-start">
								<Tooltip>
									<TooltipTrigger>
										{#snippet child({ props })}
											<InputGroupButton {...props} variant="ghost">시간당 증가</InputGroupButton>
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
