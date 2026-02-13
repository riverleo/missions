<script lang="ts">
	import { useCharacter, useInteraction } from '$lib/hooks';
	import { Panel, useNodes } from '@xyflow/svelte';
	import type {
		CharacterInteractionAction,
		CharacterInteractionActionId,
		CharacterInteractionId,
		CharacterId,
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
	import { Separator } from '$lib/components/ui/separator';
	import CharacterSpriteAnimator from '$lib/components/app/sprite-animator/character-sprite-animator.svelte';
	import { createCharacterInteractionActionNodeId } from '$lib/utils/flow-id';
	import { clone } from 'radash';
	import InputGroupText from '$lib/components/ui/input-group/input-group-text.svelte';
	import {
		getActionString,
		getCharacterBodyStateLabels,
		getCharacterFaceStateLabels,
		getCharacterBodyStateString,
		getCharacterFaceStateString,
	} from '$lib/utils/label';

	interface Props {
		action: CharacterInteractionAction | undefined;
		characterInteractionId: CharacterInteractionId;
		hasParent?: boolean;
	}

	let { action, characterInteractionId, hasParent = false }: Props = $props();

	const { characterStore } = useCharacter();
	const {
		characterInteractionStore,
		characterInteractionActionStore,
		admin,
	} = useInteraction();
	const flowNodes = useNodes();

	const interaction = $derived($characterInteractionStore.data[characterInteractionId]);
	const interactionActions = $derived(
		$characterInteractionActionStore.data[characterInteractionId] ?? []
	);
	const characters = $derived(Object.values($characterStore.data));

	// 미리보기용 캐릭터 선택
	const behaviorHasSpecificCharacter = $derived(interaction?.character_id != null);
	let previewCharacterId = $state<CharacterId | undefined>(undefined);
	const previewCharacter = $derived(
		behaviorHasSpecificCharacter && interaction?.character_id
			? $characterStore.data[interaction.character_id as CharacterId]
			: previewCharacterId
				? $characterStore.data[previewCharacterId as CharacterId]
				: characters[0]
	);
	const selectedPreviewCharacterLabel = $derived(previewCharacter?.name ?? '캐릭터 선택');

	function onPreviewCharacterChange(value: string | undefined) {
		previewCharacterId = (value as CharacterId) || undefined;
	}

	const bodyStateTypes = getCharacterBodyStateLabels();
	const faceStateTypes = getCharacterFaceStateLabels();

	let isUpdating = $state(false);
	let changes = $state<CharacterInteractionAction | undefined>(undefined);
	let currentActionId = $state<string | undefined>(undefined);

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

	function onTargetBodyStateChange(value: string | undefined) {
		if (changes && value) {
			changes.target_character_body_state_type = value as CharacterBodyStateType;
		}
	}

	function onTargetFaceStateChange(value: string | undefined) {
		if (changes && value) {
			changes.target_character_face_state_type = value as CharacterFaceStateType;
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
				const otherRootActions = interactionActions.filter((a) => a.id !== actionId && a.root);
				await Promise.all(
					otherRootActions.map((a) => admin.updateCharacterInteractionAction(a.id, { root: false }))
				);
			}

			await admin.updateCharacterInteractionAction(actionId, {
				character_body_state_type: changes.character_body_state_type,
				character_face_state_type: changes.character_face_state_type,
				target_character_body_state_type: changes.target_character_body_state_type,
				target_character_face_state_type: changes.target_character_face_state_type,
				target_character_offset_x: changes.target_character_offset_x,
				target_character_offset_y: changes.target_character_offset_y,
				target_character_scale: changes.target_character_scale,
				target_character_rotation: changes.target_character_rotation,
				duration_ticks: Math.max(1, Number(changes.duration_ticks)),
				root: changes.root,
			});
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
				n.id === createCharacterInteractionActionNodeId(action) ? { ...n, selected: false } : n
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
									{getCharacterBodyStateString(changes.character_body_state_type)}
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
									{getCharacterFaceStateString(changes.character_face_state_type)}
								</SelectTrigger>
								<SelectContent>
									{#each faceStateTypes as faceStateType (faceStateType.value)}
										<SelectItem value={faceStateType.value}>{faceStateType.label}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</ButtonGroup>

						<ButtonGroup class="w-full">
							<ButtonGroupText>대상 캐릭터 바디</ButtonGroupText>
							<Select
								type="single"
								value={changes.target_character_body_state_type}
								onValueChange={onTargetBodyStateChange}
							>
								<SelectTrigger class="flex-1">
									{getCharacterBodyStateString(changes.target_character_body_state_type)}
								</SelectTrigger>
								<SelectContent>
									{#each bodyStateTypes as bodyStateType (bodyStateType.value)}
										<SelectItem value={bodyStateType.value}>{bodyStateType.label}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</ButtonGroup>

						<ButtonGroup class="w-full">
							<ButtonGroupText>대상 캐릭터 표정</ButtonGroupText>
							<Select
								type="single"
								value={changes.target_character_face_state_type}
								onValueChange={onTargetFaceStateChange}
							>
								<SelectTrigger class="flex-1">
									{getCharacterFaceStateString(changes.target_character_face_state_type)}
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
										액션이 지속되는 시간입니다. 최소 1틱 이상이어야 합니다.
									</TooltipContent>
								</Tooltip>
							</InputGroupAddon>
							<InputGroupInput
								type="number"
								step="1"
								min="1"
								placeholder="1"
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
								bind:value={changes.target_character_offset_x}
							/>
							<InputGroupText><IconX /></InputGroupText>
							<InputGroupInput
								type="number"
								step="1"
								placeholder="0"
								bind:value={changes.target_character_offset_y}
							/>
						</InputGroup>

						<div class="flex gap-2">
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
									bind:value={changes.target_character_scale}
								/>
								<InputGroupAddon align="inline-end">
									<InputGroupText>배</InputGroupText>
								</InputGroupAddon>
							</InputGroup>

							<InputGroup>
								<InputGroupAddon align="inline-start">
									<InputGroupButton>회전</InputGroupButton>
								</InputGroupAddon>
								<InputGroupInput
									type="number"
									step="0.1"
									placeholder="0"
									bind:value={changes.target_character_rotation}
								/>
								<InputGroupAddon align="inline-end">
									<InputGroupText>도</InputGroupText>
								</InputGroupAddon>
							</InputGroup>
						</div>

						{#if previewCharacter && changes && interaction}
							<Separator />

							<div class="flex flex-col gap-2">
								<div
									class="relative flex items-end justify-center overflow-hidden rounded-md border bg-neutral-100 dark:bg-neutral-900"
									style:height="120px"
								>
									<CharacterSpriteAnimator
										characterId={previewCharacter.id}
										bodyStateType={changes.character_body_state_type}
										faceStateType={changes.character_face_state_type}
										interactCharacterId={interaction.target_character_id}
										interactCharacterBodyStateType={changes.target_character_body_state_type}
										interactCharacterFaceStateType={changes.target_character_face_state_type}
										interactCharacterOffset={{
											x: changes.target_character_offset_x,
											y: changes.target_character_offset_y,
										}}
										interactCharacterScale={changes.target_character_scale}
										interactCharacterRotation={changes.target_character_rotation}
										resolution={2}
									/>
								</div>

								{#if !behaviorHasSpecificCharacter && characters.length > 0}
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
								{isUpdating ? getActionString('saving') : getActionString('save')}
							</Button>
						</div>
					</div>
				</form>
			{/if}
		</CardContent>
	</Card>
</Panel>
