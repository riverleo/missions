<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type {
		NeedBehaviorAction,
		NeedBehaviorActionType,
		CharacterBodyStateType,
		CharacterFaceStateType,
		CharacterId,
		BuildingId,
		ItemId,
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
	import { Separator } from '$lib/components/ui/separator';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
		DropdownMenuSub,
		DropdownMenuSubTrigger,
		DropdownMenuSubContent,
	} from '$lib/components/ui/dropdown-menu';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { useNeedBehavior } from '$lib/hooks/use-need-behavior';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useCharacterBody } from '$lib/hooks/use-character-body';
	import { useItem } from '$lib/hooks/use-item';
	import { CharacterSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { createActionNodeId } from '$lib/utils/flow-id';
	import { getCharacterBodyStateLabel, getCharacterFaceStateLabel } from '$lib/utils/state-label';
	import { clone } from 'radash';

	interface Props {
		action: NeedBehaviorAction | undefined;
		hasParent?: boolean;
	}

	let { action, hasParent = false }: Props = $props();

	const { needBehaviorStore, needBehaviorActionStore, admin } = useNeedBehavior();
	const { store: buildingStore } = useBuilding();
	const { store: characterStore, faceStateStore } = useCharacter();
	const { store: characterBodyStore, bodyStateStore } = useCharacterBody();
	const { store: itemStore } = useItem();
	const flowNodes = useNodes();

	const buildings = $derived(Object.values($buildingStore.data));
	const characters = $derived(Object.values($characterStore.data));
	const items = $derived(Object.values($itemStore.data));

	// 미리보기용 캐릭터 선택
	const parentBehavior = $derived(action ? $needBehaviorStore.data[action.behavior_id] : undefined);
	const behaviorHasSpecificCharacter = $derived(parentBehavior?.character_id != null);

	let previewCharacterId = $state<string | undefined>(undefined);
	const previewCharacter = $derived(
		behaviorHasSpecificCharacter && parentBehavior?.character_id
			? $characterStore.data[parentBehavior.character_id as CharacterId]
			: previewCharacterId
				? $characterStore.data[previewCharacterId as CharacterId]
				: characters[0]
	);
	const selectedPreviewCharacterLabel = $derived(previewCharacter?.name ?? '캐릭터 선택');

	const actionTypes: { value: NeedBehaviorActionType; label: string }[] = [
		{ value: 'go', label: '이동' },
		{ value: 'interact', label: '상호작용' },
		{ value: 'idle', label: '대기' },
	];

	const bodyStateTypes: CharacterBodyStateType[] = ['idle', 'walk', 'run', 'jump'];
	const faceStateTypes: CharacterFaceStateType[] = ['idle', 'happy', 'sad', 'angry'];

	let isUpdating = $state(false);
	let changes = $state<NeedBehaviorAction | undefined>(undefined);
	let currentActionId = $state<string | undefined>(undefined);

	const selectedTypeLabel = $derived(
		actionTypes.find((t) => t.value === changes?.type)?.label ?? '액션 타입'
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
	const selectedTargetLabel = $derived.by(() => {
		if (changes?.building_id) {
			const building = buildings.find((b) => b.id === changes?.building_id);
			return building ? `${building.name} (건물)` : '건물 선택';
		}
		if (changes?.character_id) {
			const character = characters.find((c) => c.id === changes?.character_id);
			return character ? `${character.name} (캐릭터)` : '캐릭터 선택';
		}
		if (changes?.item_id) {
			const item = items.find((i) => i.id === changes?.item_id);
			return item ? `${item.name} (아이템)` : '아이템 선택';
		}
		return '자동 선택';
	});

	// 선택된 바디/얼굴 상태로 미리보기
	const previewCharacterBody = $derived(
		previewCharacter ? $characterBodyStore.data[previewCharacter.character_body_id] : undefined
	);
	const previewBodyStates = $derived(
		previewCharacterBody ? ($bodyStateStore.data[previewCharacterBody.id] ?? []) : []
	);
	const previewBodyState = $derived(
		changes?.character_body_state_type
			? previewBodyStates.find((s) => s.type === changes!.character_body_state_type)
			: undefined
	);
	const previewFaceStates = $derived(
		previewCharacter ? ($faceStateStore.data[previewCharacter.id] ?? []) : []
	);
	const previewFaceState = $derived(
		previewFaceStates.find((s) => s.type === changes?.character_face_state_type)
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

	function onSelectBuilding(buildingId: string) {
		if (changes) {
			changes.building_id = buildingId as BuildingId;
			changes.character_id = null;
			changes.item_id = null;
		}
	}

	function onSelectCharacter(characterId: string) {
		if (changes) {
			changes.character_id = characterId as CharacterId;
			changes.building_id = null;
			changes.item_id = null;
		}
	}

	function onSelectItem(itemId: string) {
		if (changes) {
			changes.item_id = itemId as ItemId;
			changes.building_id = null;
			changes.character_id = null;
		}
	}

	function onSelectAutoTarget() {
		if (changes) {
			changes.building_id = null;
			changes.character_id = null;
			changes.item_id = null;
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
				duration_ticks: changes.duration_ticks,
				character_body_state_type: changes.character_body_state_type,
				character_face_state_type: changes.character_face_state_type,
				building_id: changes.building_id,
				character_id: changes.character_id,
				item_id: changes.item_id,
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
							<ButtonGroupText>행동</ButtonGroupText>
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
									<ButtonGroupText>대상</ButtonGroupText>
									<DropdownMenu>
										<DropdownMenuTrigger
											class="flex h-9 flex-1 items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm"
										>
											{selectedTargetLabel}
										</DropdownMenuTrigger>
										<DropdownMenuContent align="start" class="w-56">
											<DropdownMenuItem onclick={onSelectAutoTarget}>자동 선택</DropdownMenuItem>
											<DropdownMenuSub>
												<DropdownMenuSubTrigger>건물</DropdownMenuSubTrigger>
												<DropdownMenuSubContent>
													{#each buildings as building (building.id)}
														<DropdownMenuItem onclick={() => onSelectBuilding(building.id)}>
															{building.name}
														</DropdownMenuItem>
													{/each}
												</DropdownMenuSubContent>
											</DropdownMenuSub>
											<DropdownMenuSub>
												<DropdownMenuSubTrigger>캐릭터</DropdownMenuSubTrigger>
												<DropdownMenuSubContent>
													{#each characters as character (character.id)}
														<DropdownMenuItem onclick={() => onSelectCharacter(character.id)}>
															{character.name}
														</DropdownMenuItem>
													{/each}
												</DropdownMenuSubContent>
											</DropdownMenuSub>
											<DropdownMenuSub>
												<DropdownMenuSubTrigger>아이템</DropdownMenuSubTrigger>
												<DropdownMenuSubContent>
													{#each items as item (item.id)}
														<DropdownMenuItem onclick={() => onSelectItem(item.id)}>
															{item.name}
														</DropdownMenuItem>
													{/each}
												</DropdownMenuSubContent>
											</DropdownMenuSub>
										</DropdownMenuContent>
									</DropdownMenu>
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
											자동 선택 시 대상을 기준으로 욕구를 채워줄 수 있는 <br />
											가까운 건물 또는 캐릭터, 아이템을 선택합니다.
										</TooltipContent>
									</Tooltip>
								</ButtonGroup>
							</ButtonGroup>
						{:else if changes.type === 'idle'}
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
						{/if}

						<Separator />

						{#if changes.type === 'idle'}
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
						{/if}
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

						{#if previewBodyState}
							<Separator />

							<div class="flex flex-col gap-2">
								<div
									class="relative flex items-end justify-center overflow-hidden rounded-md border bg-neutral-100 dark:bg-neutral-900"
									style:height="120px"
								>
									<CharacterSpriteAnimator
										bodyState={previewBodyState}
										faceState={previewFaceState}
										resolution={2}
									/>
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
