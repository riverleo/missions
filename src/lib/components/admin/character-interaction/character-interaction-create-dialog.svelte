<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
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
	import type {
		CharacterId,
		OnceInteractionType,
		RepeatInteractionType,
		ScenarioId,
	} from '$lib/types';

	const {
		characterStore,
		characterInteractionDialogStore,
		closeCharacterInteractionDialog,
		admin,
	} = useCharacter();

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const open = $derived($characterInteractionDialogStore?.type === 'create');

	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));

	let targetCharacterId = $state<CharacterId | undefined>(undefined);
	let interactionType = $state<OnceInteractionType | RepeatInteractionType>('character_hug');
	let characterId = $state<CharacterId | undefined>(undefined);
	let isSubmitting = $state(false);

	const onceOptions = getCharacterOnceInteractionTypeOptions();
	const repeatOptions = getCharacterRepeatInteractionTypeOptions();
	const allOptions = [...onceOptions, ...repeatOptions];

	const selectedTargetCharacter = $derived(characters.find((c) => c.id === targetCharacterId));
	const selectedTargetCharacterName = $derived(selectedTargetCharacter?.name ?? '대상 캐릭터 선택');
	const selectedCharacter = $derived(characters.find((c) => c.id === characterId));
	const selectedCharacterName = $derived(selectedCharacter?.name ?? '모두');
	const selectedBehaviorLabel = $derived(
		allOptions.find((o) => o.value === interactionType)?.label ?? '포옹'
	);

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
		if (isSubmitting) return;
		if (!targetCharacterId) return;

		isSubmitting = true;

		try {
			const isOnce = onceOptions.some((o) => o.value === interactionType);

			const interaction = await admin.createCharacterInteraction(scenarioId, {
				target_character_id: targetCharacterId,
				once_interaction_type: isOnce ? (interactionType as OnceInteractionType) : null,
				repeat_interaction_type: isOnce ? null : (interactionType as RepeatInteractionType),
				character_id: characterId || null,
			});

			closeCharacterInteractionDialog();
			goto(`/admin/scenarios/${scenarioId}/character-interactions/${interaction.id}`);
		} catch (error) {
			console.error('Failed to create interaction:', error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>캐릭터 상호작용 생성</DialogTitle>
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
					<ButtonGroupText>상호 작용</ButtonGroupText>
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
					{isSubmitting ? '생성 중...' : '생성'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
