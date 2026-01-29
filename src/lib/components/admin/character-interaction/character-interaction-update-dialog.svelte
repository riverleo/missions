<script lang="ts">
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
	import { useCharacter } from '$lib/hooks/use-character';
	import {
		getCharacterOnceInteractionTypeOptions,
		getCharacterRepeatInteractionTypeOptions,
	} from '$lib/utils/state-label';
	import { alphabetical } from 'radash';
	import type { CharacterId, OnceInteractionType, RepeatInteractionType } from '$lib/types';

	const {
		characterStore,
		characterInteractionStore,
		characterInteractionDialogStore,
		closeCharacterInteractionDialog,
		admin,
	} = useCharacter();

	const open = $derived($characterInteractionDialogStore?.type === 'update');
	const interactionId = $derived(
		$characterInteractionDialogStore?.type === 'update'
			? $characterInteractionDialogStore.interactionId
			: undefined
	);
	const interaction = $derived(
		interactionId ? $characterInteractionStore.data[interactionId] : undefined
	);

	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));

	let targetCharacterId = $state<CharacterId | undefined>(undefined);
	let interactionType = $state<OnceInteractionType | RepeatInteractionType>('character_hug');
	let characterId = $state<CharacterId | undefined>(undefined);
	let isSubmitting = $state(false);

	const onceOptions = getCharacterOnceInteractionTypeOptions();
	const repeatOptions = getCharacterRepeatInteractionTypeOptions();
	const allOptions = [...onceOptions, ...repeatOptions];

	const selectedTargetCharacter = $derived(characters.find((c) => c.id === targetCharacterId));
	const selectedTargetCharacterName = $derived(
		targetCharacterId === undefined ? '기본 (모든 캐릭터)' : selectedTargetCharacter?.name ?? '대상 캐릭터 선택'
	);
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
				(interaction.repeat_interaction_type as RepeatInteractionType | null) ||
				'character_hug';
			characterId = interaction.character_id || undefined;
		}
	});

	function onTargetCharacterChange(value: string | undefined) {
		targetCharacterId = (value as CharacterId) || undefined;
	}

	function onInteractionTypeChange(value: string | undefined) {
		if (value) {
			interactionType = value as OnceInteractionType | RepeatInteractionType;
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
		if (!interactionId || isSubmitting) return;

		isSubmitting = true;

		try {
			const isOnce = onceOptions.some((o) => o.value === interactionType);

			await admin.updateCharacterInteraction(interactionId, {
				target_character_id: targetCharacterId || undefined,
				once_interaction_type: isOnce ? (interactionType as OnceInteractionType) : null,
				repeat_interaction_type: isOnce ? null : (interactionType as RepeatInteractionType),
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
							<SelectItem value="">기본 (모든 캐릭터)</SelectItem>
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
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '수정 중...' : '수정'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
