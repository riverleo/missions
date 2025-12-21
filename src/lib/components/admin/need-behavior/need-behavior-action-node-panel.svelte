<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type { NeedBehaviorAction, NeedBehaviorActionType, CharacterStateType } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { IconCategory } from '@tabler/icons-svelte';
	import { useNeedBehavior } from '$lib/hooks/use-need-behavior';
	import { createActionNodeId } from '$lib/utils/flow-id';
	import { clone } from 'radash';

	interface Props {
		action: NeedBehaviorAction | undefined;
	}

	let { action }: Props = $props();

	const { admin } = useNeedBehavior();
	const flowNodes = useNodes();

	const actionTypes: { value: NeedBehaviorActionType; label: string }[] = [
		{ value: 'go_to', label: '이동' },
		{ value: 'wait', label: '대기' },
		{ value: 'state', label: '상태' },
	];

	const stateTypes: CharacterStateType[] = [
		'idle',
		'walk',
		'jump',
		'eating',
		'sleeping',
		'angry',
		'sad',
		'happy',
	];

	let isUpdating = $state(false);
	let changes = $state<NeedBehaviorAction | undefined>(undefined);
	let currentActionId = $state<string | undefined>(undefined);

	const selectedTypeLabel = $derived(
		actionTypes.find((t) => t.value === changes?.type)?.label ?? '액션 타입'
	);
	const selectedStateLabel = $derived(changes?.character_state_type ?? '상태 선택');

	$effect(() => {
		if (action && action.id !== currentActionId) {
			currentActionId = action.id;
			changes = clone(action);
		}
	});

	function onTypeChange(value: string | undefined) {
		if (changes && value) {
			changes.type = value as NeedBehaviorActionType;
		}
	}

	function onStateChange(value: string | undefined) {
		if (changes) {
			changes.character_state_type = (value as CharacterStateType) ?? null;
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!changes || isUpdating) return;

		const actionId = changes.id;
		isUpdating = true;

		admin
			.updateAction(actionId, {
				type: changes.type,
				duration_per_second: changes.duration_per_second,
				character_state_type: changes.character_state_type,
			})
			.then(() => {
				// 선택 해제
				const nodeId = `action-${actionId}`;
				flowNodes.update((ns) =>
					ns.map((n) => (n.id === nodeId ? { ...n, selected: false } : n))
				);
			})
			.catch((error: Error) => {
				console.error('Failed to update action:', error);
			})
			.finally(() => {
				isUpdating = false;
			});
	}

	function onclickCancel() {
		if (!action) return;

		flowNodes.update((ns) =>
			ns.map((n) => (n.id === createActionNodeId(action) ? { ...n, selected: false } : n))
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
							<ButtonGroupText>
								<IconCategory class="size-4" />
							</ButtonGroupText>
							<Select type="single" value={changes.type} onValueChange={onTypeChange}>
								<SelectTrigger class="w-full">
									{selectedTypeLabel}
								</SelectTrigger>
								<SelectContent>
									{#each actionTypes as actionType (actionType.value)}
										<SelectItem value={actionType.value}>{actionType.label}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</ButtonGroup>

						{#if changes.type === 'wait'}
							<InputGroup>
								<InputGroupAddon align="inline-start">
									<InputGroupText>대기 시간(초)</InputGroupText>
								</InputGroupAddon>
								<InputGroupInput
									type="number"
									step="0.1"
									min="0"
									bind:value={changes.duration_per_second}
								/>
							</InputGroup>
						{:else if changes.type === 'state'}
							<ButtonGroup class="w-full">
								<ButtonGroupText>상태</ButtonGroupText>
								<Select
									type="single"
									value={changes.character_state_type ?? undefined}
									onValueChange={onStateChange}
								>
									<SelectTrigger class="w-full">
										{selectedStateLabel}
									</SelectTrigger>
									<SelectContent>
										{#each stateTypes as stateType (stateType)}
											<SelectItem value={stateType}>{stateType}</SelectItem>
										{/each}
									</SelectContent>
								</Select>
							</ButtonGroup>
							<InputGroup>
								<InputGroupAddon align="inline-start">
									<InputGroupText>재생 시간(초)</InputGroupText>
								</InputGroupAddon>
								<InputGroupInput
									type="number"
									step="0.1"
									min="0"
									bind:value={changes.duration_per_second}
								/>
							</InputGroup>
						{/if}
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
