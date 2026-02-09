<script lang="ts">
	import { useCharacter, useInteraction } from '$lib/hooks';
	import type {
		BehaviorInteractionType,
		CharacterInteractionActionUpdate,
		ScenarioId,
	} from '$lib/types';
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
	import {
		getBehaviorInteractTypeString,
		getBehaviorInteractionTypeLabels,
		getFallbackString,
		isOnceInteractionType,
		isFulfillInteractionType,
		getCharacterBodyStateString,
		getCharacterFaceStateString,
	} from '$lib/utils/label';
	import type {
		Character,
		CharacterInteraction,
		CharacterInteractionId,
		CharacterInteractionAction,
		CharacterInteractionActionId,
		CharacterId,
		OnceInteractionType,
		FulfillInteractionType,
		CharacterBodyStateType,
		CharacterFaceStateType,
	} from '$lib/types';

	interface Props {
		interaction: CharacterInteraction;
		characterInteractionId: CharacterInteractionId;
	}

	let { interaction, characterInteractionId }: Props = $props();

	const { characterStore, getOrUndefinedCharacter } = useCharacter();
	const { characterInteractionActionStore, openCharacterInteractionDialog, admin } =
		useInteraction();

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const targetCharacter = $derived($characterStore.data[interaction.target_character_id]);
	const actions = $derived($characterInteractionActionStore.data[characterInteractionId] ?? []);
	const characters = $derived(Object.values($characterStore.data));

	const rootAction = $derived(actions.find((a: CharacterInteractionAction) => a.root));

	let interactionType = $state<BehaviorInteractionType>(
		interaction.once_interaction_type ||
			interaction.fulfill_interaction_type ||
			('character_hug' as FulfillInteractionType)
	);
	let characterId = $state<CharacterId | undefined>(interaction.character_id ?? undefined);

	const behaviorInteractionTypeLabels = getBehaviorInteractionTypeLabels('character');

	const selectedCharacter = $derived(getOrUndefinedCharacter(characterId));

	async function updateCharacterInteraction() {
		await admin.updateCharacterInteraction(characterInteractionId, {
			once_interaction_type: isOnceInteractionType(interactionType) ? interactionType : null,
			fulfill_interaction_type: isFulfillInteractionType(interactionType) ? interactionType : null,
			character_id: characterId ?? null,
		});
	}

	async function createCharacterInteractionAction() {
		await admin.createCharacterInteractionAction(scenarioId, characterInteractionId, {
			root: actions.length === 0, // First action is root
		});
	}

	async function updateCharacterInteractionAction(
		id: CharacterInteractionActionId,
		updates: CharacterInteractionActionUpdate
	) {
		await admin.updateCharacterInteractionAction(id, updates);
	}

	async function removeCharacterInteractionAction(id: CharacterInteractionActionId) {
		await admin.removeCharacterInteractionAction(id);
	}
</script>

<div class="flex h-full flex-col gap-4 p-4">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold">{targetCharacter?.name} 상호작용</h2>
		<Button
			variant="destructive"
			size="sm"
			onclick={() => openCharacterInteractionDialog({ type: 'delete', characterInteractionId })}
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
									{getBehaviorInteractTypeString(interactionType)}
								</InputGroupButton>
							{/snippet}
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuRadioGroup
								value={interactionType}
								onValueChange={(value) => {
									interactionType = value as OnceInteractionType | FulfillInteractionType;
									updateCharacterInteraction();
								}}
							>
								{#each behaviorInteractionTypeLabels as option (option.value)}
									<DropdownMenuRadioItem value={option.value}>
										{option.label}
									</DropdownMenuRadioItem>
								{/each}
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
									{selectedCharacter?.name ?? getFallbackString('allCharacters')}
								</InputGroupButton>
							{/snippet}
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuRadioGroup
								value={characterId}
								onValueChange={(value) => {
									characterId = (value || undefined) as CharacterId | undefined;
									updateCharacterInteraction();
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
			<Button size="sm" onclick={createCharacterInteractionAction}>
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
											await updateCharacterInteractionAction(rootAction.id, { root: false });
										}
										await updateCharacterInteractionAction(action.id, { root: isRoot });
									}}
								/>
								<span class="text-sm font-medium">Root</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onclick={() => removeCharacterInteractionAction(action.id)}
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
													{getCharacterBodyStateString(action.character_body_state_type)}
												</InputGroupButton>
											{/snippet}
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											<DropdownMenuRadioGroup
												value={action.character_body_state_type}
												onValueChange={(value) => {
													updateCharacterInteractionAction(action.id, {
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
													{getCharacterFaceStateString(action.character_face_state_type)}
												</InputGroupButton>
											{/snippet}
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											<DropdownMenuRadioGroup
												value={action.character_face_state_type}
												onValueChange={(value) => {
													updateCharacterInteractionAction(action.id, {
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
								value={action.target_character_offset_x}
								onchange={(e) => {
									const value = parseInt(e.currentTarget.value) || 0;
									updateCharacterInteractionAction(action.id, { target_character_offset_x: value });
								}}
								placeholder="x"
							/>
							<InputGroupText>
								<IconX class="size-3" />
							</InputGroupText>
							<InputGroupInput
								type="number"
								value={action.target_character_offset_y}
								onchange={(e) => {
									const value = parseInt(e.currentTarget.value) || 0;
									updateCharacterInteractionAction(action.id, { target_character_offset_y: value });
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
									value={action.target_character_scale}
									onchange={(e) => {
										const value = parseFloat(e.currentTarget.value) || 1.0;
										updateCharacterInteractionAction(action.id, { target_character_scale: value });
									}}
								/>
							</InputGroup>

							<InputGroup>
								<InputGroupAddon align="inline-start">
									<InputGroupText>회전</InputGroupText>
								</InputGroupAddon>
								<InputGroupInput
									type="number"
									value={action.target_character_rotation}
									onchange={(e) => {
										const value = parseFloat(e.currentTarget.value) || 0;
										updateCharacterInteractionAction(action.id, {
											target_character_rotation: value,
										});
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
									updateCharacterInteractionAction(action.id, { duration_ticks: value });
								}}
							/>
						</InputGroup>
					</CardContent>
				</Card>
			{/each}
		</CardContent>
	</Card>
</div>
