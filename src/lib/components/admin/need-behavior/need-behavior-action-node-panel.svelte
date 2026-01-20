<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type {
		NeedBehaviorAction,
		BehaviorActionType,
		CharacterBehaviorType,
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
		InputGroupButton,
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
	import { useItem } from '$lib/hooks/use-item';
	import { createActionNodeId } from '$lib/utils/flow-id';
	import { getCharacterBehaviorTypeLabel } from '$lib/utils/state-label';
	import { clone } from 'radash';

	interface Props {
		action: NeedBehaviorAction | undefined;
		hasParent?: boolean;
	}

	let { action, hasParent = false }: Props = $props();

	const { needBehaviorStore, needBehaviorActionStore, admin } = useNeedBehavior();
	const { store: buildingStore } = useBuilding();
	const { store: characterStore } = useCharacter();
	const { store: itemStore } = useItem();
	const flowNodes = useNodes();

	const buildings = $derived(Object.values($buildingStore.data));
	const characters = $derived(Object.values($characterStore.data));
	const items = $derived(Object.values($itemStore.data));

	const actionTypes: { value: BehaviorActionType; label: string }[] = [
		{ value: 'go', label: '이동' },
		{ value: 'interact', label: '상호작용' },
		{ value: 'idle', label: '대기' },
	];

	const behaviorTypes: { value: CharacterBehaviorType; label: string }[] = [
		{ value: 'use', label: '사용' },
		{ value: 'repair', label: '수리' },
		{ value: 'demolish', label: '철거' },
		{ value: 'clean', label: '청소' },
		{ value: 'pick', label: '줍기' },
	];

	let isUpdating = $state(false);
	let changes = $state<NeedBehaviorAction | undefined>(undefined);
	let currentActionId = $state<string | undefined>(undefined);

	const selectedTypeLabel = $derived(
		actionTypes.find((t) => t.value === changes?.type)?.label ?? '액션 타입'
	);
	const selectedBehaviorTypeLabel = $derived(
		changes?.character_behavior_type
			? getCharacterBehaviorTypeLabel(changes.character_behavior_type)
			: '행동 타입'
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

	$effect(() => {
		if (action && action.id !== currentActionId) {
			currentActionId = action.id;
			changes = clone(action);
		}
	});

	function onTypeChange(value: string | undefined) {
		if (changes && value) {
			changes.type = value as BehaviorActionType;
		}
	}

	function onBehaviorTypeChange(value: string | undefined) {
		if (changes) {
			changes.character_behavior_type = (value as CharacterBehaviorType) || null;
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
				character_behavior_type: changes.character_behavior_type,
				duration_ticks: changes.duration_ticks,
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
						{/if}

						{#if changes.type === 'interact'}
							<ButtonGroup class="w-full">
								<ButtonGroupText>상호작용</ButtonGroupText>
								<Select
									type="single"
									value={changes.character_behavior_type ?? ''}
									onValueChange={onBehaviorTypeChange}
								>
									<SelectTrigger class="flex-1">
										{selectedBehaviorTypeLabel}
									</SelectTrigger>
									<SelectContent>
										{#each behaviorTypes as behaviorType (behaviorType.value)}
											<SelectItem value={behaviorType.value}>{behaviorType.label}</SelectItem>
										{/each}
									</SelectContent>
								</Select>
							</ButtonGroup>
						{/if}

						{#if changes.type === 'idle'}
							<InputGroup>
								<InputGroupAddon align="inline-start">
									<Tooltip>
										<TooltipTrigger>
											<InputGroupButton>지속 시간(틱)</InputGroupButton>
										</TooltipTrigger>
										<TooltipContent>
											idle 타입에서만 사용됩니다. 0이면 즉시 다음 액션으로 넘어갑니다.
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
