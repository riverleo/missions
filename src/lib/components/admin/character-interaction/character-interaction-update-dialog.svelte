<script lang="ts">
	import { useCharacter, useInteraction } from '$lib/hooks';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import {
		getCharacterOnceInteractionTypeOptions,
		getCharacterFulfillInteractionTypeOptions,
		getCharacterSystemInteractionTypeOptions,
	} from '$lib/utils/state-label';
	import { alphabetical } from 'radash';
	import type {
		CharacterId,
		OnceInteractionType,
		FulfillInteractionType,
		SystemInteractionType,
	} from '$lib/types';

	const { characterStore } = useCharacter();
	const {
		characterInteractionStore,
		characterInteractionDialogStore,
		closeCharacterInteractionDialog,
		admin,
	} = useInteraction();

	const open = $derived($characterInteractionDialogStore?.type === 'update');
	const characterInteractionId = $derived(
		$characterInteractionDialogStore?.type === 'update'
			? $characterInteractionDialogStore.characterInteractionId
			: undefined
	);
	const interaction = $derived(
		characterInteractionId ? $characterInteractionStore.data[characterInteractionId] : undefined
	);

	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));

	let targetCharacterId = $state<CharacterId | undefined>(undefined);
	let interactionType = $state<OnceInteractionType | FulfillInteractionType | SystemInteractionType>(
		'character_hug'
	);
	let characterId = $state<CharacterId | undefined>(undefined);
	let isSubmitting = $state(false);

	const onceOptions = getCharacterOnceInteractionTypeOptions();
	const fulfillOptions = getCharacterFulfillInteractionTypeOptions();
	const systemOptions = getCharacterSystemInteractionTypeOptions();
	const allOptions = [...onceOptions, ...fulfillOptions, ...systemOptions];

	const selectedTargetCharacter = $derived(characters.find((c) => c.id === targetCharacterId));
	const selectedTargetCharacterName = $derived(selectedTargetCharacter?.name ?? '대상 캐릭터 선택');
	const selectedCharacter = $derived(characters.find((c) => c.id === characterId));
	const selectedCharacterName = $derived(selectedCharacter?.name ?? '모두');
	const selectedBehaviorLabel = $derived(
		allOptions.find((o) => o.value === interactionType)?.label ?? '포옹'
	);

	// interaction이 변경될 때 폼 초기화
	$effect(() => {
		if (interaction) {
			targetCharacterId = interaction.target_character_id || undefined;
			interactionType =
				(interaction.once_interaction_type as OnceInteractionType | null) ||
				(interaction.fulfill_interaction_type as FulfillInteractionType | null) ||
				(interaction.system_interaction_type as SystemInteractionType | null) ||
				'character_hug';
			characterId = interaction.character_id || undefined;
		}
	});

	function onTargetCharacterChange(value: string | undefined) {
		targetCharacterId = (value as CharacterId) || undefined;
	}

	function onInteractionTypeChange(value: string | undefined) {
		if (value) {
			interactionType = value as OnceInteractionType | FulfillInteractionType | SystemInteractionType;
		}
	}

	function onCharacterChange(value: string | undefined) {
		characterId = (value as CharacterId) || undefined;
	}

	function onOpenChange(value: boolean) {
		if (!value) {
			closeCharacterInteractionDialog();
		}
	}

	async function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!characterInteractionId || !targetCharacterId || isSubmitting) return;

		isSubmitting = true;

		try {
			// Determine interaction type
			const isOnce = onceOptions.some((o) => o.value === interactionType);
			const isFulfill = fulfillOptions.some((o) => o.value === interactionType);
			const isSystem = systemOptions.some((o) => o.value === interactionType);

			await admin.updateCharacterInteraction(characterInteractionId, {
				target_character_id: targetCharacterId,
				once_interaction_type: isOnce ? (interactionType as OnceInteractionType) : null,
				fulfill_interaction_type: isFulfill ? (interactionType as FulfillInteractionType) : null,
				system_interaction_type: isSystem ? (interactionType as SystemInteractionType) : null,
				character_id: characterId || undefined,
			});

			closeCharacterInteractionDialog();
		} catch (error) {
			console.error('Failed to update interaction:', error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>캐릭터 상호작용 수정</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<ButtonGroup class="w-full">
					<ButtonGroupText>대상 캐릭터</ButtonGroupText>
					<Select type="single" value={targetCharacterId} onValueChange={onTargetCharacterChange}>
						<SelectTrigger class="flex-1">
							{selectedTargetCharacterName}
						</SelectTrigger>
						<SelectContent>
							{#each characters as character (character.id)}
								<SelectItem value={character.id}>{character.name}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</ButtonGroup>

				<ButtonGroup class="w-full">
					<ButtonGroupText>캐릭터</ButtonGroupText>
					<Select type="single" value={characterId} onValueChange={onCharacterChange}>
						<SelectTrigger class="flex-1">
							{selectedCharacterName}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">모두</SelectItem>
							{#each characters as character (character.id)}
								<SelectItem value={character.id}>{character.name}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
					<ButtonGroupText>상호작용</ButtonGroupText>
					<Select type="single" value={interactionType} onValueChange={onInteractionTypeChange}>
						<SelectTrigger class="flex-1">
							{selectedBehaviorLabel}
						</SelectTrigger>
						<SelectContent>
							{#each allOptions as option (option.value)}
								<SelectItem value={option.value}>{option.label}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</ButtonGroup>
			</div>

			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !targetCharacterId}>
					{isSubmitting ? '수정 중...' : '수정'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
