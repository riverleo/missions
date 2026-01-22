<script lang="ts">
	import type {
		ItemInteraction,
		ItemInteractionId,
		CharacterId,
	} from '$lib/types';
	import { Panel } from '@xyflow/svelte';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconLayoutDistributeHorizontal, IconPlus } from '@tabler/icons-svelte';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import CharacterSpriteAnimator from '$lib/components/app/sprite-animator/character-sprite-animator.svelte';
	import { useItem } from '$lib/hooks/use-item';
	import { useCharacter } from '$lib/hooks/use-character';

	interface Props {
		interaction: ItemInteraction | undefined;
		itemInteractionId: ItemInteractionId;
		onlayout?: () => void;
	}

	let { interaction, itemInteractionId, onlayout }: Props = $props();

	const { itemInteractionActionStore, itemStateStore, itemStore, admin } = useItem();
	const { characterStore } = useCharacter();

	const actions = $derived($itemInteractionActionStore.data[itemInteractionId] ?? []);
	const characters = $derived(Object.values($characterStore.data));

	// 아이템 상태 가져오기
	const itemStates = $derived(
		interaction?.item_id ? $itemStateStore.data[interaction.item_id] ?? [] : []
	);
	const heldItemState = $derived(itemStates[0]); // 첫 번째 state 사용

	// 루트 액션 찾기
	const rootAction = $derived(actions.find((a) => a.root));

	// 미리보기용 캐릭터 선택
	const behaviorHasSpecificCharacter = $derived(interaction?.character_id != null);
	let previewCharacterId = $state<string | undefined>(undefined);
	const previewCharacter = $derived(
		behaviorHasSpecificCharacter && interaction?.character_id
			? $characterStore.data[interaction.character_id as CharacterId]
			: previewCharacterId
				? $characterStore.data[previewCharacterId as CharacterId]
				: characters[0]
	);
	const selectedPreviewCharacterLabel = $derived(previewCharacter?.name ?? '캐릭터 선택');

	function onPreviewCharacterChange(value: string | undefined) {
		previewCharacterId = value || undefined;
	}

	let isLayouting = $state(false);
	let isCreating = $state(false);

	function onclickLayout() {
		if (isLayouting || !onlayout) return;

		isLayouting = true;

		try {
			onlayout();
		} finally {
			isLayouting = false;
		}
	}

	async function onclickCreate() {
		if (isCreating || !interaction) return;

		isCreating = true;

		try {
			await admin.createItemInteractionAction(itemInteractionId, {
				root: false,
			});
		} catch (error) {
			console.error('Failed to create action:', error);
		} finally {
			isCreating = false;
		}
	}
</script>

<Panel position="bottom-center">
	<div class="flex gap-2">
		<ButtonGroup>
			<Tooltip>
				<TooltipTrigger>
					{#snippet child({ props })}
						<Button
							{...props}
							onclick={onclickCreate}
							disabled={isCreating || !interaction}
							size="icon-lg"
							variant="outline"
						>
							<IconPlus />
						</Button>
					{/snippet}
				</TooltipTrigger>
				<TooltipContent>액션 추가</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger>
					{#snippet child({ props })}
						<Button
							{...props}
							onclick={onclickLayout}
							disabled={isLayouting}
							size="icon-lg"
							variant="outline"
						>
							<IconLayoutDistributeHorizontal />
						</Button>
					{/snippet}
				</TooltipTrigger>
				<TooltipContent>자동 정렬</TooltipContent>
			</Tooltip>
		</ButtonGroup>

		{#if rootAction && previewCharacter && interaction}
			<Card class="w-64 py-4">
				<CardContent class="px-4">
					<div class="space-y-2">
						<div
							class="relative flex items-end justify-center overflow-hidden rounded-md border bg-neutral-100 dark:bg-neutral-900"
							style:height="120px"
						>
							<CharacterSpriteAnimator
								characterId={previewCharacter.id}
								bodyStateType={rootAction.character_body_state_type}
								faceStateType={rootAction.character_face_state_type}
								heldItemState={heldItemState}
								heldItemOffset={{ x: rootAction.item_offset_x, y: rootAction.item_offset_y }}
								heldItemScale={rootAction.item_scale}
								heldItemRotation={rootAction.item_rotation}
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
				</CardContent>
			</Card>
		{/if}
	</div>
</Panel>
