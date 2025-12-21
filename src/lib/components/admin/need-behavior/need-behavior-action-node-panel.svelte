<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type {
		NeedBehaviorAction,
		NeedBehaviorActionType,
		CharacterBodyStateType,
		CharacterFaceStateType,
	} from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { IconCircleDashedNumber1, IconInfoCircle } from '@tabler/icons-svelte';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { useNeedBehavior } from '$lib/hooks/use-need-behavior';
	import { useBuilding } from '$lib/hooks/use-building';
	import { createActionNodeId } from '$lib/utils/flow-id';
	import { getCharacterBodyStateLabel, getCharacterFaceStateLabel } from '$lib/utils/state-label';
	import { clone } from 'radash';

	interface Props {
		action: NeedBehaviorAction | undefined;
		hasParent?: boolean;
	}

	let { action, hasParent = false }: Props = $props();

	const { needBehaviorActionStore, admin } = useNeedBehavior();
	const { store: buildingStore } = useBuilding();
	const flowNodes = useNodes();

	const buildings = $derived(Object.values($buildingStore.data));

	const actionTypes: { value: NeedBehaviorActionType; label: string }[] = [
		{ value: 'go', label: '이동' },
		{ value: 'interact', label: '상호작용' },
		{ value: 'wait', label: '대기' },
		{ value: 'state', label: '캐릭터 상태' },
	];

	const bodyStateTypes: CharacterBodyStateType[] = ['idle', 'walk', 'jump', 'eating', 'sleeping'];
	const faceStateTypes: CharacterFaceStateType[] = ['neutral', 'happy', 'sad', 'angry'];

	let isUpdating = $state(false);
	let changes = $state<NeedBehaviorAction | undefined>(undefined);
	let currentActionId = $state<string | undefined>(undefined);

	const selectedTypeLabel = $derived(
		actionTypes.find((t) => t.value === changes?.type)?.label ?? '액션 타입'
	);
	const selectedBodyStateLabel = $derived(
		changes?.character_body_state_type
			? getCharacterBodyStateLabel(changes.character_body_state_type)
			: '선택 안함'
	);
	const selectedFaceStateLabel = $derived(
		changes?.character_face_state_type
			? getCharacterFaceStateLabel(changes.character_face_state_type)
			: '선택 안함'
	);
	const selectedBuildingLabel = $derived(
		changes?.building_id
			? (buildings.find((b) => b.id === changes?.building_id)?.name ?? '건물 선택')
			: '자동 선택'
	);

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

	function onBodyStateChange(value: string | undefined) {
		if (changes) {
			changes.character_body_state_type = (value as CharacterBodyStateType) || null;
		}
	}

	function onFaceStateChange(value: string | undefined) {
		if (changes) {
			changes.character_face_state_type = (value as CharacterFaceStateType) || null;
		}
	}

	function onBuildingChange(value: string | undefined) {
		if (changes) {
			changes.building_id = value || null;
		}
	}

	async function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!changes || isUpdating) return;

		const actionId = changes.id;
		const behaviorId = changes.behavior_id;
		isUpdating = true;

		try {
			// root로 설정할 때 다른 root 액션들을 먼저 해제
			if (changes.root) {
				const allActions = Object.values($needBehaviorActionStore.data);
				const otherRootActions = allActions.filter(
					(a) => a.behavior_id === behaviorId && a.id !== actionId && a.root
				);
				await Promise.all(
					otherRootActions.map((a) => admin.updateNeedBehaviorAction(a.id, { root: false }))
				);
			}

			await admin.updateNeedBehaviorAction(actionId, {
				type: changes.type,
				duration_per_second: changes.duration_per_second,
				character_body_state_type: changes.character_body_state_type,
				character_face_state_type: changes.character_face_state_type,
				building_id: changes.building_id,
				root: changes.root,
			});

			// 선택 해제
			const nodeId = `action-${actionId}`;
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
							<ButtonGroupText class="w-[72px]">타입</ButtonGroupText>
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
								<ButtonGroup class="flex-1">
									<ButtonGroupText class="w-[72px]">대상</ButtonGroupText>
									<Select
										type="single"
										value={changes.building_id ?? ''}
										onValueChange={onBuildingChange}
									>
										<SelectTrigger class="flex-1">
											{selectedBuildingLabel}
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="">자동 선택</SelectItem>
											{#each buildings as building (building.id)}
												<SelectItem value={building.id}>{building.name}</SelectItem>
											{/each}
										</SelectContent>
									</Select>
								</ButtonGroup>
								<ButtonGroup>
									<Tooltip>
										<TooltipTrigger>
											{#snippet child({ props })}
												<Button {...props} variant="ghost" size="icon" class="rounded-full">
													<IconInfoCircle class="size-4" />
												</Button>
											{/snippet}
										</TooltipTrigger>
										<TooltipContent>
											자동 선택 시 욕구를 가장 많이 채워주는 <br />
											건물 또는 캐릭터를 찾아 자동으로 선택합니다.
										</TooltipContent>
									</Tooltip>
								</ButtonGroup>
							</ButtonGroup>
						{:else if changes.type === 'wait'}
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
								<ButtonGroupText class="w-[72px]">바디</ButtonGroupText>
								<Select
									type="single"
									value={changes.character_body_state_type ?? ''}
									onValueChange={onBodyStateChange}
								>
									<SelectTrigger class="flex-1">
										{selectedBodyStateLabel}
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">선택 안함</SelectItem>
										{#each bodyStateTypes as stateType (stateType)}
											<SelectItem value={stateType}
												>{getCharacterBodyStateLabel(stateType)}</SelectItem
											>
										{/each}
									</SelectContent>
								</Select>
							</ButtonGroup>
							<ButtonGroup class="w-full">
								<ButtonGroupText class="w-[72px]">표정</ButtonGroupText>
								<Select
									type="single"
									value={changes.character_face_state_type ?? ''}
									onValueChange={onFaceStateChange}
								>
									<SelectTrigger class="flex-1">
										{selectedFaceStateLabel}
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">선택 안함</SelectItem>
										{#each faceStateTypes as stateType (stateType)}
											<SelectItem value={stateType}
												>{getCharacterFaceStateLabel(stateType)}</SelectItem
											>
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
					<div class="flex justify-between gap-2">
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
