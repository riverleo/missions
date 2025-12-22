<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type {
		BuildingBehaviorAction,
		BuildingStateType,
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
	import { IconCircleDashedNumber1, IconX } from '@tabler/icons-svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { useBuildingBehavior } from '$lib/hooks/use-building-behavior';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useCharacter } from '$lib/hooks/use-character';
	import {
		CharacterSpriteAnimator,
		BuildingSpriteAnimator,
	} from '$lib/components/app/sprite-animator';
	import { createBuildingBehaviorActionNodeId } from '$lib/utils/flow-id';
	import {
		getBuildingStateLabel,
		getCharacterBodyStateLabel,
		getCharacterFaceStateLabel,
	} from '$lib/utils/state-label';
	import { clone } from 'radash';

	interface Props {
		action: BuildingBehaviorAction | undefined;
		hasParent?: boolean;
	}

	let { action, hasParent = false }: Props = $props();

	const { buildingBehaviorStore, buildingBehaviorActionStore, admin } = useBuildingBehavior();
	const { store: buildingStore } = useBuilding();
	const { store: characterStore } = useCharacter();
	const flowNodes = useNodes();

	const characters = $derived(Object.values($characterStore.data));

	const buildingStateTypes: BuildingStateType[] = ['idle', 'damaged', 'planning'];
	const bodyStateTypes: CharacterBodyStateType[] = ['idle', 'walk', 'run', 'jump'];
	const faceStateTypes: CharacterFaceStateType[] = ['neutral', 'happy', 'sad', 'angry'];

	let isUpdating = $state(false);
	let changes = $state<BuildingBehaviorAction | undefined>(undefined);
	let currentActionId = $state<string | undefined>(undefined);

	// 미리보기용 캐릭터 선택
	let previewCharacterId = $state<string | undefined>(undefined);
	const previewCharacter = $derived(
		previewCharacterId ? $characterStore.data[previewCharacterId] : characters[0]
	);
	const selectedPreviewCharacterLabel = $derived(previewCharacter?.name ?? '캐릭터 선택');

	// 현재 액션의 행동 -> 건물 가져오기
	const currentBehavior = $derived(
		changes?.behavior_id ? $buildingBehaviorStore.data[changes.behavior_id] : undefined
	);
	const currentBuilding = $derived(
		currentBehavior?.building_id ? $buildingStore.data[currentBehavior.building_id] : undefined
	);
	// 건물 상태
	const previewBuildingState = $derived(
		currentBuilding?.building_states.find((s) => s.type === changes?.building_state_type)
	);

	const selectedBuildingStateLabel = $derived(
		changes?.building_state_type ? getBuildingStateLabel(changes.building_state_type) : '상태 선택'
	);
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
	const previewBodyState = $derived(
		previewCharacter?.character_body
			? previewCharacter.character_body.character_body_states.find(
					(s) => s.type === (changes?.character_body_state_type ?? 'idle')
				)
			: undefined
	);
	const previewFaceState = $derived(
		changes?.character_face_state_type && previewCharacter
			? previewCharacter.character_face_states.find(
					(s) => s.type === changes!.character_face_state_type
				)
			: undefined
	);

	// 미리보기 해상도
	const PREVIEW_RESOLUTION = 2;

	function onPreviewCharacterChange(value: string | undefined) {
		previewCharacterId = value || undefined;
	}

	$effect(() => {
		if (action && action.id !== currentActionId) {
			currentActionId = action.id;
			changes = clone(action);
		}
	});

	function onBuildingStateChange(value: string | undefined) {
		if (changes) {
			changes.building_state_type = (value as BuildingStateType) || null;
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

	async function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!changes || isUpdating) return;

		const actionId = changes.id;
		const behaviorId = changes.behavior_id;
		isUpdating = true;

		try {
			// root로 설정할 때 다른 root 액션들을 먼저 해제
			if (changes.root) {
				const allActions = Object.values($buildingBehaviorActionStore.data);
				const otherRootActions = allActions.filter(
					(a) => a.behavior_id === behaviorId && a.id !== actionId && a.root
				);
				await Promise.all(
					otherRootActions.map((a) => admin.updateBuildingBehaviorAction(a.id, { root: false }))
				);
			}

			await admin.updateBuildingBehaviorAction(actionId, {
				duration_ticks: changes.duration_ticks,
				building_state_type: changes.building_state_type,
				character_body_state_type: changes.character_body_state_type,
				character_face_state_type: changes.character_face_state_type,
				offset_x: changes.offset_x,
				offset_y: changes.offset_y,
				root: changes.root,
			});

			// 선택 해제
			const nodeId = `building-behavior-action-${actionId}`;
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
				n.id === createBuildingBehaviorActionNodeId(action) ? { ...n, selected: false } : n
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
								<InputGroupText>지속 시간(틱)</InputGroupText>
							</InputGroupAddon>
							<InputGroupInput
								type="number"
								step="0.1"
								min="0"
								bind:value={changes.duration_ticks}
							/>
						</InputGroup>

						<InputGroup>
							<InputGroupAddon align="inline-start">
								<InputGroupText>오프셋</InputGroupText>
							</InputGroupAddon>
							<InputGroupInput type="number" bind:value={changes.offset_x} placeholder="x" />
							<InputGroupText>
								<IconX />
							</InputGroupText>
							<InputGroupInput type="number" bind:value={changes.offset_y} placeholder="y" />
						</InputGroup>

						<Separator />

						<ButtonGroup class="w-full">
							<ButtonGroupText>건물</ButtonGroupText>
							<Select
								type="single"
								value={changes.building_state_type ?? ''}
								onValueChange={onBuildingStateChange}
							>
								<SelectTrigger class="flex-1">
									{selectedBuildingStateLabel}
								</SelectTrigger>
								<SelectContent>
									{#each buildingStateTypes as stateType (stateType)}
										<SelectItem value={stateType}>
											{getBuildingStateLabel(stateType)}
										</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</ButtonGroup>
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

						{#if previewBuildingState && previewBodyState}
							<Separator />

							<div class="flex flex-col gap-2">
								<div
									class="relative flex items-end justify-center overflow-hidden rounded-md border bg-neutral-100 dark:bg-neutral-900"
									style:height="120px"
								>
									<div class="relative">
										<BuildingSpriteAnimator
											buildingState={previewBuildingState}
											resolution={PREVIEW_RESOLUTION}
										/>
										<div
											class="absolute bottom-0 left-1/2"
											style:transform="translate(calc(-50% + {changes.offset_x /
												PREVIEW_RESOLUTION}px), {-changes.offset_y / PREVIEW_RESOLUTION}px)"
										>
											<CharacterSpriteAnimator
												bodyState={previewBodyState}
												faceState={previewFaceState}
												resolution={PREVIEW_RESOLUTION}
												flip={changes.offset_x < 0}
											/>
										</div>
									</div>
								</div>

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
