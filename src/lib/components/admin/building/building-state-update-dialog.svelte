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
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { IconListNumbers } from '@tabler/icons-svelte';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useCondition } from '$lib/hooks/use-condition';
	import type { BuildingStateId, ConditionId } from '$lib/types';

	const { stateStore, admin, stateDialogStore, closeStateDialog } = useBuilding();
	const { conditionStore } = useCondition();

	const open = $derived($stateDialogStore?.type === 'update');
	const buildingStateId = $derived(
		$stateDialogStore?.type === 'update' ? $stateDialogStore.buildingStateId : undefined
	);

	// Find the building state from all building states
	const buildingState = $derived.by(() => {
		if (!buildingStateId) return undefined;
		for (const states of Object.values($stateStore.data)) {
			const state = states.find((s) => s.id === buildingStateId);
			if (state) return state;
		}
		return undefined;
	});

	const conditions = $derived(Object.values($conditionStore.data));

	let conditionId = $state<string>('');

	const selectedCondition = $derived.by(() => {
		if (!conditionId) return null;
		return conditions.find((c) => c.id === conditionId);
	});
	let minValue = $state('');
	let maxValue = $state('');
	let priority = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && buildingState) {
			conditionId = buildingState.condition_id ?? '';
			minValue = buildingState.min_value.toString();
			maxValue = buildingState.max_value.toString();
			priority = buildingState.priority.toString();
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeStateDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!buildingStateId || !buildingState || isSubmitting) return;

		isSubmitting = true;

		const min = parseFloat(minValue) || 0;
		const max = parseFloat(maxValue) || 100;
		const prio = parseInt(priority) || 0;

		admin
			.updateBuildingState(buildingStateId as BuildingStateId, buildingState.building_id, {
				condition_id: conditionId ? (conditionId as ConditionId) : null,
				min_value: min,
				max_value: max,
				priority: prio,
			})
			.then(() => {
				closeStateDialog();
			})
			.catch((error) => {
				console.error('Failed to update building state:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>건물 상태 수정</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<Tooltip>
							<TooltipTrigger>
								{#snippet child({ props: tooltipProps })}
									<DropdownMenu>
										<DropdownMenuTrigger>
											{#snippet child({ props })}
												<InputGroupButton {...tooltipProps} {...props}>
													{selectedCondition?.name ?? '컨디션 선택'}
												</InputGroupButton>
											{/snippet}
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											<DropdownMenuRadioGroup bind:value={conditionId}>
												{#each conditions as condition (condition.id)}
													<DropdownMenuRadioItem value={condition.id}>
														{condition.name}
													</DropdownMenuRadioItem>
												{/each}
											</DropdownMenuRadioGroup>
										</DropdownMenuContent>
									</DropdownMenu>
								{/snippet}
							</TooltipTrigger>
							<TooltipContent>이 상태가 활성화되는 조건을 선택합니다</TooltipContent>
						</Tooltip>
					</InputGroupAddon>
					<InputGroupInput placeholder="최소" type="number" step="0.1" bind:value={minValue} />
					<InputGroupText>~</InputGroupText>
					<InputGroupInput placeholder="최대" type="number" step="0.1" bind:value={maxValue} />
					<InputGroupAddon align="inline-end">
						{#if selectedCondition}
							<InputGroupText>최대 {selectedCondition.max_value}</InputGroupText>
						{/if}
					</InputGroupAddon>
				</InputGroup>

				<InputGroup>
					<InputGroupAddon align="inline-start">
						<Tooltip>
							<TooltipTrigger>
								{#snippet child({ props })}
									<InputGroupButton {...props}>우선 순위</InputGroupButton>
								{/snippet}
							</TooltipTrigger>
							<TooltipContent>
								여러 조건이 동시에 만족될 때 높은 우선 순위를 가진 상태가 먼저 적용됩니다
							</TooltipContent>
						</Tooltip>
					</InputGroupAddon>
					<InputGroupInput placeholder="우선 순위" type="number" bind:value={priority} />
				</InputGroup>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '저장 중...' : '저장'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
