<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type {
		ConditionBehaviorAction,
		CharacterBodyStateType,
		CharacterFaceStateType,
		CharacterId,
		ConditionBehaviorId,
		ConditionId,
		CharacterBodyId,
		BuildingId,
	} from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupText,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import { IconCircleDashedNumber1, IconX } from '@tabler/icons-svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { useConditionBehavior } from '$lib/hooks/use-condition-behavior';
	import { useCondition } from '$lib/hooks/use-condition';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useCharacterBody } from '$lib/hooks/use-character-body';
	import { useBuilding } from '$lib/hooks/use-building';
	import {
		CharacterSpriteAnimator,
		BuildingSpriteAnimator,
	} from '$lib/components/app/sprite-animator';
	import { createConditionBehaviorActionNodeId } from '$lib/utils/flow-id';
	import { getCharacterBodyStateLabel, getCharacterFaceStateLabel } from '$lib/utils/state-label';
	import { clone } from 'radash';

	interface Props {
		action: ConditionBehaviorAction | undefined;
		hasParent?: boolean;
	}

	let { action, hasParent = false }: Props = $props();

	const { conditionBehaviorStore, conditionBehaviorActionStore, admin } = useConditionBehavior();
	const { conditionStore } = useCondition();
	const { store: characterStore, faceStateStore } = useCharacter();
	const { store: characterBodyStore, bodyStateStore } = useCharacterBody();
	const { store: buildingStore, stateStore: buildingStateStore } = useBuilding();
	const flowNodes = useNodes();

	const characters = $derived(Object.values($characterStore.data));
	const buildings = $derived(Object.values($buildingStore.data));

	const bodyStateTypes: CharacterBodyStateType[] = ['idle', 'walk', 'run', 'jump', 'pick'];
	const faceStateTypes: CharacterFaceStateType[] = ['idle', 'happy', 'sad', 'angry'];

	let isUpdating = $state(false);
	let changes = $state<ConditionBehaviorAction | undefined>(undefined);
	let currentActionId = $state<string | undefined>(undefined);

	// 부모 behavior 조회
	const parentBehavior = $derived(
		action ? $conditionBehaviorStore.data[action.condition_behavior_id] : undefined
	);
	const behaviorHasSpecificCharacter = $derived(parentBehavior?.character_id != null);

	// 미리보기용 캐릭터 선택
	let previewCharacterId = $state<string | undefined>(undefined);
	const previewCharacter = $derived(
		behaviorHasSpecificCharacter && parentBehavior?.character_id
			? $characterStore.data[parentBehavior.character_id as CharacterId]
			: previewCharacterId
				? $characterStore.data[previewCharacterId as CharacterId]
				: characters[0]
	);
	const selectedPreviewCharacterLabel = $derived(previewCharacter?.name ?? '캐릭터 선택');

	// 미리보기용 건물 (부모 behavior의 building_id 사용)
	const previewBuilding = $derived(
		parentBehavior?.building_id
			? $buildingStore.data[parentBehavior.building_id as BuildingId]
			: buildings[0]
	);

	// 미리보기용 건물은 previewBuilding 그대로 사용

	const selectedBodyStateLabel = $derived(
		changes?.character_body_state_type
			? getCharacterBodyStateLabel(changes.character_body_state_type)
			: '바디 선택'
	);
	const selectedFaceStateLabel = $derived(
		changes?.character_face_state_type
			? getCharacterFaceStateLabel(changes.character_face_state_type)
			: '표정 선택'
	);

	// 선택된 바디/얼굴 상태로 미리보기
	const previewCharacterBody = $derived(
		previewCharacter ? $characterBodyStore.data[previewCharacter.character_body_id] : undefined
	);
	const previewBodyStates = $derived(
		previewCharacterBody ? ($bodyStateStore.data[previewCharacterBody.id] ?? []) : []
	);
	const previewBodyState = $derived(
		previewBodyStates.find((s: any) => s.type === (changes?.character_body_state_type ?? 'idle'))
	);
	const previewFaceStates = $derived(
		previewCharacter ? ($faceStateStore.data[previewCharacter.id] ?? []) : []
	);
	const previewFaceState = $derived(
		changes?.character_face_state_type
			? previewFaceStates.find((s: any) => s.type === changes!.character_face_state_type)
			: undefined
	);

	function onPreviewCharacterChange(value: string | undefined) {
		previewCharacterId = value || undefined;
	}

	$effect(() => {
		if (action && action.id !== currentActionId) {
			currentActionId = action.id;
			changes = clone(action);
		}
	});

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
				duration_ticks: changes.duration_ticks,
				character_body_state_type: changes.character_body_state_type,
				character_face_state_type: changes.character_face_state_type,
				character_offset_x: changes.character_offset_x,
				character_offset_y: changes.character_offset_y,
				character_scale: changes.character_scale,
				character_rotation: changes.character_rotation,
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
						<InputGroup>
							<InputGroupAddon align="inline-start">
								<Tooltip>
									<TooltipTrigger>
										<InputGroupButton>지속 시간(틱)</InputGroupButton>
									</TooltipTrigger>
									<TooltipContent>
										지속 시간이 없는 경우 캐릭터 바디 애니메이션 종료 후 다음으로 넘어갑니다.
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

						<InputGroup>
							<InputGroupAddon align="inline-start">
								<InputGroupText>캐릭터 오프셋</InputGroupText>
							</InputGroupAddon>
							<InputGroupInput
								type="number"
								bind:value={changes.character_offset_x}
								placeholder="x"
							/>
							<InputGroupText>
								<IconX />
							</InputGroupText>
							<InputGroupInput
								type="number"
								bind:value={changes.character_offset_y}
								placeholder="y"
							/>
						</InputGroup>

						<div class="flex gap-2">
							<InputGroup>
								<InputGroupAddon align="inline-start">
									<InputGroupText>스케일</InputGroupText>
								</InputGroupAddon>
								<InputGroupInput
									type="number"
									step="0.01"
									min="0"
									bind:value={changes.character_scale}
								/>
								<InputGroupAddon align="inline-end">
									<InputGroupText>배</InputGroupText>
								</InputGroupAddon>
							</InputGroup>

							<InputGroup>
								<InputGroupAddon align="inline-start">
									<InputGroupText>회전</InputGroupText>
								</InputGroupAddon>
								<InputGroupInput type="number" bind:value={changes.character_rotation} />
								<InputGroupAddon align="inline-end">
									<InputGroupText>도</InputGroupText>
								</InputGroupAddon>
							</InputGroup>
						</div>

						<Separator />

						<ButtonGroup class="w-full">
							<ButtonGroupText>캐릭터 바디</ButtonGroupText>
							<Select
								type="single"
								value={changes.character_body_state_type ?? ''}
								onValueChange={onBodyStateChange}
							>
								<SelectTrigger class="flex-1">
									{selectedBodyStateLabel}
								</SelectTrigger>
								<SelectContent>
									{#each bodyStateTypes as stateType (stateType)}
										<SelectItem value={stateType}>
											{getCharacterBodyStateLabel(stateType)}
										</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</ButtonGroup>
						<ButtonGroup class="w-full">
							<ButtonGroupText>캐릭터 표정</ButtonGroupText>
							<Select
								type="single"
								value={changes.character_face_state_type ?? ''}
								onValueChange={onFaceStateChange}
							>
								<SelectTrigger class="flex-1">
									{selectedFaceStateLabel}
								</SelectTrigger>
								<SelectContent>
									{#each faceStateTypes as stateType (stateType)}
										<SelectItem value={stateType}>
											{getCharacterFaceStateLabel(stateType)}
										</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</ButtonGroup>

						{#if previewBuilding && previewBodyState}
							<Separator />

							<div class="flex flex-col gap-2">
								<div
									class="relative flex items-end justify-center overflow-hidden rounded-md border bg-neutral-100 dark:bg-neutral-900"
									style:height="120px"
								>
									{#if previewBuilding && previewCharacter && changes?.character_body_state_type}
										<BuildingSpriteAnimator
											buildingId={previewBuilding.id}
											stateType="idle"
											characterId={previewCharacter.id}
											characterBodyStateType={changes.character_body_state_type}
											characterFaceStateType={changes.character_face_state_type ?? undefined}
											characterOffset={{
												x: changes.character_offset_x,
												y: changes.character_offset_y,
											}}
											characterScale={changes.character_scale}
											characterRotation={changes.character_rotation}
											resolution={2}
										/>
									{/if}
								</div>

								{#if !behaviorHasSpecificCharacter}
									<ButtonGroup class="w-full">
										<ButtonGroupText>캐릭터</ButtonGroupText>
										<Select
											type="single"
											value={previewCharacterId ?? previewCharacter?.id ?? ''}
											onValueChange={onPreviewCharacterChange}
										>
											<SelectTrigger class="flex-1">
												{selectedPreviewCharacterLabel}
											</SelectTrigger>
											<SelectContent>
												{#each characters as character (character.id)}
													<SelectItem value={character.id}>{character.name}</SelectItem>
												{/each}
											</SelectContent>
										</Select>
									</ButtonGroup>
								{/if}
							</div>
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
