<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type {
		BuildingInteractionAction,
		BuildingInteractionActionId,
		BuildingInteractionId,
		CharacterBodyStateType,
		CharacterFaceStateType,
	} from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import { IconCircleDashedNumber1, IconX } from '@tabler/icons-svelte';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { useBuilding } from '$lib/hooks/use-building';
	import { createBuildingInteractionActionNodeId } from '$lib/utils/flow-id';
	import { clone } from 'radash';
	import InputGroupText from '$lib/components/ui/input-group/input-group-text.svelte';

	interface Props {
		action: BuildingInteractionAction | undefined;
		buildingInteractionId: BuildingInteractionId;
		hasParent?: boolean;
	}

	let { action, buildingInteractionId, hasParent = false }: Props = $props();

	const { buildingInteractionActionStore, admin } = useBuilding();
	const flowNodes = useNodes();

	const bodyStateTypes: { value: CharacterBodyStateType; label: string }[] = [
		{ value: 'idle', label: '대기' },
		{ value: 'walk', label: '걷기' },
		{ value: 'run', label: '뛰기' },
		{ value: 'jump', label: '점프' },
		{ value: 'pick', label: '줍기' },
	];

	const faceStateTypes: { value: CharacterFaceStateType; label: string }[] = [
		{ value: 'idle', label: '기본' },
		{ value: 'happy', label: '행복' },
		{ value: 'sad', label: '슬픔' },
		{ value: 'angry', label: '화남' },
	];

	let isUpdating = $state(false);
	let changes = $state<BuildingInteractionAction | undefined>(undefined);
	let currentActionId = $state<string | undefined>(undefined);

	const selectedBodyStateLabel = $derived(
		bodyStateTypes.find((t) => t.value === changes?.character_body_state_type)?.label ??
			'캐릭터 바디'
	);
	const selectedFaceStateLabel = $derived(
		faceStateTypes.find((t) => t.value === changes?.character_face_state_type)?.label ??
			'캐릭터 표정'
	);

	$effect(() => {
		if (action && action.id !== currentActionId) {
			currentActionId = action.id;
			changes = clone(action);
		}
	});

	function onBodyStateChange(value: string | undefined) {
		if (changes && value) {
			changes.character_body_state_type = value as CharacterBodyStateType;
		}
	}

	function onFaceStateChange(value: string | undefined) {
		if (changes && value) {
			changes.character_face_state_type = value as CharacterFaceStateType;
		}
	}

	async function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!changes || isUpdating) return;

		const actionId = changes.id;
		isUpdating = true;

		try {
			// root로 설정할 때 다른 root 액션들을 먼저 해제
			if (changes.root) {
				const allActions = $buildingInteractionActionStore.data[buildingInteractionId] ?? [];
				const otherRootActions = allActions.filter((a) => a.id !== actionId && a.root);
				await Promise.all(
					otherRootActions.map((a) =>
						admin.updateInteractionAction(a.id, buildingInteractionId, { root: false })
					)
				);
			}

			await admin.updateInteractionAction(actionId, buildingInteractionId, {
				character_body_state_type: changes.character_body_state_type,
				character_face_state_type: changes.character_face_state_type,
				character_offset_x: changes.character_offset_x,
				character_offset_y: changes.character_offset_y,
				character_scale: changes.character_scale,
				character_rotation: changes.character_rotation,
				duration_ticks: changes.duration_ticks,
				root: changes.root,
			});

			// 선택 해제
			const nodeId = `building-interaction-action-${actionId}`;
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
				n.id === createBuildingInteractionActionNodeId(action) ? { ...n, selected: false } : n
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
							<ButtonGroupText>캐릭터 바디</ButtonGroupText>
							<Select
								type="single"
								value={changes.character_body_state_type}
								onValueChange={onBodyStateChange}
							>
								<SelectTrigger class="flex-1">
									{selectedBodyStateLabel}
								</SelectTrigger>
								<SelectContent>
									{#each bodyStateTypes as bodyStateType (bodyStateType.value)}
										<SelectItem value={bodyStateType.value}>{bodyStateType.label}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</ButtonGroup>

						<ButtonGroup class="w-full">
							<ButtonGroupText>캐릭터 표정</ButtonGroupText>
							<Select
								type="single"
								value={changes.character_face_state_type}
								onValueChange={onFaceStateChange}
							>
								<SelectTrigger class="flex-1">
									{selectedFaceStateLabel}
								</SelectTrigger>
								<SelectContent>
									{#each faceStateTypes as faceStateType (faceStateType.value)}
										<SelectItem value={faceStateType.value}>{faceStateType.label}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</ButtonGroup>

						<InputGroup>
							<InputGroupAddon align="inline-start">
								<Tooltip>
									<TooltipTrigger>
										<InputGroupButton>지속 시간(틱)</InputGroupButton>
									</TooltipTrigger>
									<TooltipContent>
										이 액션이 지속되는 시간입니다. 0이면 즉시 다음 액션으로 넘어갑니다.
									</TooltipContent>
								</Tooltip>
							</InputGroupAddon>
							<InputGroupInput
								type="number"
								step="1"
								min="0"
								placeholder="0"
								bind:value={changes.duration_ticks}
							/>
						</InputGroup>

						<InputGroup>
							<InputGroupAddon align="inline-start">
								<InputGroupButton>오프셋</InputGroupButton>
							</InputGroupAddon>
							<InputGroupInput
								type="number"
								step="1"
								placeholder="0"
								bind:value={changes.character_offset_x}
							/>
							<InputGroupText><IconX /></InputGroupText>
							<InputGroupInput
								type="number"
								step="1"
								placeholder="0"
								bind:value={changes.character_offset_y}
							/>
						</InputGroup>

						<InputGroup>
							<InputGroupAddon align="inline-start">
								<InputGroupButton>스케일</InputGroupButton>
							</InputGroupAddon>
							<InputGroupInput
								type="number"
								step="0.01"
								min="0.01"
								max="5"
								placeholder="1.0"
								bind:value={changes.character_scale}
							/>
						</InputGroup>

						<InputGroup>
							<InputGroupAddon align="inline-start">
								<InputGroupButton>회전</InputGroupButton>
							</InputGroupAddon>
							<InputGroupInput
								type="number"
								step="0.1"
								placeholder="0"
								bind:value={changes.character_rotation}
							/>
						</InputGroup>
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
