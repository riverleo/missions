<script lang="ts">
	import type { ScenarioId } from '$lib/types';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuRadioGroup,
		DropdownMenuRadioItem,
	} from '$lib/components/ui/dropdown-menu';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupButton,
		InputGroupInput,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { IconPlus, IconTrash, IconX } from '@tabler/icons-svelte';
	import { useItem } from '$lib/hooks/use-item';
	import { useCharacter } from '$lib/hooks/use-character';
	import type {
		ItemInteraction,
		ItemInteractionId,
		ItemInteractionAction,
		ItemInteractionActionId,
		CharacterId,
		CharacterBehaviorType,
		CharacterBodyStateType,
		CharacterFaceStateType,
	} from '$lib/types';

	interface Props {
		interaction: ItemInteraction;
		interactionId: ItemInteractionId;
	}

	let { interaction, interactionId }: Props = $props();

	const { itemStore, itemInteractionActionStore, openItemInteractionDialog, admin } = useItem();

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const { characterStore } = useCharacter();

	const item = $derived($itemStore.data[interaction.item_id]);
	const actions = $derived($itemInteractionActionStore.data[interactionId] ?? []);
	const characters = $derived(Object.values($characterStore.data));

	const rootAction = $derived(actions.find((a) => a.root));

	let characterBehaviorType = $state<CharacterBehaviorType>(
		interaction.character_behavior_type
	);
	let characterId = $state<string>(interaction.character_id ?? '');

	const selectedCharacter = $derived.by(() => {
		if (!characterId) return null;
		return characters.find((c) => c.id === characterId);
	});

	async function updateInteraction() {
		await admin.updateItemInteraction(interactionId, {
			character_behavior_type: characterBehaviorType,
			character_id: characterId ? (characterId as CharacterId) : null,
		});
	}

	async function createAction() {
		await admin.createItemInteractionAction(scenarioId, interactionId, {
			root: actions.length === 0, // First action is root
		});
	}

	async function updateAction(
		actionId: ItemInteractionActionId,
		updates: Partial<ItemInteractionAction>
	) {
		await admin.updateItemInteractionAction(actionId, interactionId, updates);
	}

	async function removeAction(actionId: ItemInteractionActionId) {
		await admin.removeItemInteractionAction(actionId, interactionId);
	}

	function getBehaviorLabel(type: string) {
		const labels: Record<string, string> = {
			demolish: '철거',
			use: '사용',
			repair: '수리',
			clean: '청소',
			pick: '줍기',
		};
		return labels[type] ?? type;
	}

	function getBodyStateLabel(type: string) {
		const labels: Record<string, string> = {
			idle: '대기',
			walk: '걷기',
			run: '달리기',
			jump: '점프',
			pick: '줍기',
		};
		return labels[type] ?? type;
	}

	function getFaceStateLabel(type: string) {
		const labels: Record<string, string> = {
			idle: '기본',
			happy: '행복',
			sad: '슬픔',
			angry: '화남',
		};
		return labels[type] ?? type;
	}
</script>

<div class="flex h-full flex-col gap-4 p-4">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold">{item?.name} 상호작용</h2>
		<Button
			variant="destructive"
			size="sm"
			onclick={() => openItemInteractionDialog({ type: 'delete', interactionId })}
		>
			<IconTrash class="mr-2 size-4" />
			삭제
		</Button>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>기본 정보</CardTitle>
		</CardHeader>
		<CardContent class="flex flex-col gap-2">
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<DropdownMenu>
						<DropdownMenuTrigger>
							{#snippet child({ props })}
								<InputGroupButton {...props}>
									{getBehaviorLabel(characterBehaviorType)}
								</InputGroupButton>
							{/snippet}
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuRadioGroup
								value={characterBehaviorType}
								onValueChange={(value) => {
									characterBehaviorType = value as CharacterBehaviorType;
									updateInteraction();
								}}
							>
								<DropdownMenuRadioItem value="demolish">철거</DropdownMenuRadioItem>
								<DropdownMenuRadioItem value="use">사용</DropdownMenuRadioItem>
								<DropdownMenuRadioItem value="repair">수리</DropdownMenuRadioItem>
								<DropdownMenuRadioItem value="clean">청소</DropdownMenuRadioItem>
								<DropdownMenuRadioItem value="pick">줍기</DropdownMenuRadioItem>
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</InputGroupAddon>
			</InputGroup>

			<InputGroup>
				<InputGroupAddon align="inline-start">
					<DropdownMenu>
						<DropdownMenuTrigger>
							{#snippet child({ props })}
								<InputGroupButton {...props}>
									{selectedCharacter?.name ?? '모든 캐릭터'}
								</InputGroupButton>
							{/snippet}
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuRadioGroup
								value={characterId}
								onValueChange={(value) => {
									characterId = value;
									updateInteraction();
								}}
							>
								<DropdownMenuRadioItem value="">모든 캐릭터</DropdownMenuRadioItem>
								{#each characters as character (character.id)}
									<DropdownMenuRadioItem value={character.id}>
										{character.name}
									</DropdownMenuRadioItem>
								{/each}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</InputGroupAddon>
			</InputGroup>
		</CardContent>
	</Card>

	<Card>
		<CardHeader class="flex flex-row items-center justify-between">
			<CardTitle>액션</CardTitle>
			<Button size="sm" onclick={createAction}>
				<IconPlus class="mr-2 size-4" />
				액션 추가
			</Button>
		</CardHeader>
		<CardContent class="flex flex-col gap-2">
			{#each actions as action (action.id)}
				<Card>
					<CardContent class="flex flex-col gap-2 p-4">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<input
									type="checkbox"
									checked={action.root}
									onchange={async (e) => {
										const isRoot = e.currentTarget.checked;
										if (isRoot && rootAction && rootAction.id !== action.id) {
											await updateAction(rootAction.id, { root: false });
										}
										await updateAction(action.id, { root: isRoot });
									}}
								/>
								<span class="text-sm font-medium">Root</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onclick={() => removeAction(action.id)}
							>
								<IconTrash class="size-4" />
							</Button>
						</div>

						<div class="grid grid-cols-2 gap-2">
							<InputGroup>
								<InputGroupAddon align="inline-start">
									<DropdownMenu>
										<DropdownMenuTrigger>
											{#snippet child({ props })}
												<InputGroupButton {...props}>
													{getBodyStateLabel(action.character_body_state_type)}
												</InputGroupButton>
											{/snippet}
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											<DropdownMenuRadioGroup
												value={action.character_body_state_type}
												onValueChange={(value) => {
													updateAction(action.id, {
														character_body_state_type: value as CharacterBodyStateType,
													});
												}}
											>
												<DropdownMenuRadioItem value="idle">대기</DropdownMenuRadioItem>
												<DropdownMenuRadioItem value="walk">걷기</DropdownMenuRadioItem>
												<DropdownMenuRadioItem value="run">달리기</DropdownMenuRadioItem>
												<DropdownMenuRadioItem value="jump">점프</DropdownMenuRadioItem>
												<DropdownMenuRadioItem value="pick">줍기</DropdownMenuRadioItem>
											</DropdownMenuRadioGroup>
										</DropdownMenuContent>
									</DropdownMenu>
								</InputGroupAddon>
							</InputGroup>

							<InputGroup>
								<InputGroupAddon align="inline-start">
									<DropdownMenu>
										<DropdownMenuTrigger>
											{#snippet child({ props })}
												<InputGroupButton {...props}>
													{getFaceStateLabel(action.character_face_state_type)}
												</InputGroupButton>
											{/snippet}
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											<DropdownMenuRadioGroup
												value={action.character_face_state_type}
												onValueChange={(value) => {
													updateAction(action.id, {
														character_face_state_type: value as CharacterFaceStateType,
													});
												}}
											>
												<DropdownMenuRadioItem value="idle">기본</DropdownMenuRadioItem>
												<DropdownMenuRadioItem value="happy">행복</DropdownMenuRadioItem>
												<DropdownMenuRadioItem value="sad">슬픔</DropdownMenuRadioItem>
												<DropdownMenuRadioItem value="angry">화남</DropdownMenuRadioItem>
											</DropdownMenuRadioGroup>
										</DropdownMenuContent>
									</DropdownMenu>
								</InputGroupAddon>
							</InputGroup>
						</div>

						<InputGroup>
							<InputGroupAddon align="inline-start">
								<InputGroupText>오프셋</InputGroupText>
							</InputGroupAddon>
							<InputGroupInput
								type="number"
								value={action.item_offset_x}
								onchange={(e) => {
									const value = parseInt(e.currentTarget.value) || 0;
									updateAction(action.id, { item_offset_x: value });
								}}
								placeholder="x"
							/>
							<InputGroupText>
								<IconX class="size-3" />
							</InputGroupText>
							<InputGroupInput
								type="number"
								value={action.item_offset_y}
								onchange={(e) => {
									const value = parseInt(e.currentTarget.value) || 0;
									updateAction(action.id, { item_offset_y: value });
								}}
								placeholder="y"
							/>
						</InputGroup>

						<div class="grid grid-cols-2 gap-2">
							<InputGroup>
								<InputGroupAddon align="inline-start">
									<InputGroupText>스케일</InputGroupText>
								</InputGroupAddon>
								<InputGroupInput
									type="number"
									step="0.1"
									value={action.item_scale}
									onchange={(e) => {
										const value = parseFloat(e.currentTarget.value) || 1.0;
										updateAction(action.id, { item_scale: value });
									}}
								/>
							</InputGroup>

							<InputGroup>
								<InputGroupAddon align="inline-start">
									<InputGroupText>회전</InputGroupText>
								</InputGroupAddon>
								<InputGroupInput
									type="number"
									value={action.item_rotation}
									onchange={(e) => {
										const value = parseFloat(e.currentTarget.value) || 0;
										updateAction(action.id, { item_rotation: value });
									}}
								/>
							</InputGroup>
						</div>

						<InputGroup>
							<InputGroupAddon align="inline-start">
								<InputGroupText>지속 시간 (틱)</InputGroupText>
							</InputGroupAddon>
							<InputGroupInput
								type="number"
								step="0.1"
								value={action.duration_ticks}
								onchange={(e) => {
									const value = parseFloat(e.currentTarget.value) || 0;
									updateAction(action.id, { duration_ticks: value });
								}}
							/>
						</InputGroup>
					</CardContent>
				</Card>
			{/each}
		</CardContent>
	</Card>
</div>
