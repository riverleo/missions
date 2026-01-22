<script lang="ts">
	import { Panel, useEdges } from '@xyflow/svelte';
	import type { BuildingCondition, BuildingId } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupText,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { useCondition } from '$lib/hooks/use-condition';
	import { useBuilding } from '$lib/hooks/use-building';
	import { clone } from 'radash';

	interface Props {
		buildingCondition: BuildingCondition | undefined;
	}

	let { buildingCondition }: Props = $props();

	const { admin } = useCondition();
	const { buildingStore: buildingStore } = useBuilding();
	const flowEdges = useEdges();

	const buildings = $derived(Object.values($buildingStore.data));

	let isUpdating = $state(false);
	let changes = $state<BuildingCondition | undefined>(undefined);
	let currentBuildingConditionId = $state<string | undefined>(undefined);

	const selectedBuildingName = $derived(
		buildings.find((b) => b.id === changes?.building_id)?.name ?? '선택...'
	);

	$effect(() => {
		if (buildingCondition && buildingCondition.id !== currentBuildingConditionId) {
			currentBuildingConditionId = buildingCondition.id;
			changes = clone(buildingCondition);
		}
	});

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!changes || isUpdating) return;

		const buildingConditionId = changes.id;
		const edgeId = `building-condition-${changes.building_id}-${changes.condition_id}`;
		isUpdating = true;

		admin
			.updateBuildingCondition(buildingConditionId, {
				building_id: changes.building_id,
				decrease_multiplier: changes.decrease_multiplier,
				disabled_when_depleted: changes.disabled_when_depleted,
			})
			.then(() => {
				// 선택 해제
				flowEdges.update((es) => es.map((e) => (e.id === edgeId ? { ...e, selected: false } : e)));
			})
			.catch((error: Error) => {
				console.error('Failed to update building condition:', error);
			})
			.finally(() => {
				isUpdating = false;
			});
	}

	function onclickCancel() {
		if (!buildingCondition) return;

		const edgeId = `building-condition-${buildingCondition.building_id}-${buildingCondition.condition_id}`;
		flowEdges.update((es) => es.map((e) => (e.id === edgeId ? { ...e, selected: false } : e)));
	}

	function onBuildingChange(value: string | undefined) {
		if (value && changes) {
			changes.building_id = value as BuildingId;
		}
	}
</script>

<Panel position="top-right">
	<Card class="w-80 py-4">
		<CardContent class="px-4">
			{#if changes}
				<form {onsubmit} class="space-y-4">
					<InputGroup>
						<InputGroupAddon align="inline-start">
							<Tooltip>
								<TooltipTrigger>
									{#snippet child({ props })}
										<InputGroupButton {...props} variant="ghost">틱당 감소</InputGroupButton>
									{/snippet}
								</TooltipTrigger>
								<TooltipContent>
									건물별 컨디션 감소 속도 배율입니다.
									<br />
									기본값 1.0이며, 2.0은 두 배 빠르게 감소합니다.
								</TooltipContent>
							</Tooltip>
						</InputGroupAddon>
						<InputGroupInput
							type="number"
							step="0.01"
							bind:value={changes.decrease_multiplier}
							placeholder="감소 배율"
						/>
						<InputGroupAddon align="inline-end">
							<InputGroupText>배</InputGroupText>
						</InputGroupAddon>
					</InputGroup>
					<label class="flex cursor-pointer items-center gap-2">
						<Checkbox bind:checked={changes.disabled_when_depleted} />
						<span
							class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>
							컨디션 고갈 시 건물 사용 불가
						</span>
					</label>
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
