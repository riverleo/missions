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
	import { alphabetical } from 'radash';
	import type { CharacterId, CharacterBehaviorType, ScenarioId } from '$lib/types';

	const {
		characterStore,
		characterInteractionDialogStore,
		closeCharacterInteractionDialog,
		admin,
	} = useCharacter();

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const open = $derived($characterInteractionDialogStore?.type === 'create');

	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));

	let targetCharacterId = $state<string>('');
	let characterBehaviorType = $state<CharacterBehaviorType>('use');
	let characterId = $state<string>('');
	let isSubmitting = $state(false);

	const behaviorTypeOptions: { value: CharacterBehaviorType; label: string }[] = [
		{ value: 'demolish', label: '철거' },
		{ value: 'use', label: '사용' },
		{ value: 'repair', label: '수리' },
		{ value: 'clean', label: '청소' },
		{ value: 'pick', label: '줍기' },
	];

	const selectedTargetCharacter = $derived(characters.find((c) => c.id === targetCharacterId));
	const selectedTargetCharacterName = $derived(selectedTargetCharacter?.name ?? '대상 캐릭터 선택');
	const selectedCharacter = $derived(characters.find((c) => c.id === characterId));
	const selectedCharacterName = $derived(selectedCharacter?.name ?? '모두');
	const selectedBehaviorLabel = $derived(
		behaviorTypeOptions.find((o) => o.value === characterBehaviorType)?.label ?? '사용'
	);

	function onTargetCharacterChange(value: string | undefined) {
		targetCharacterId = value || '';
	}

	function onBehaviorTypeChange(value: string | undefined) {
		if (value) {
			characterBehaviorType = value as CharacterBehaviorType;
		}
	}

	function onCharacterChange(value: string | undefined) {
		characterId = value || '';
	}

	function onOpenChange(value: boolean) {
		if (!value) {
			closeCharacterInteractionDialog();
		}
	}

	async function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!targetCharacterId || isSubmitting) return;

		isSubmitting = true;

		try {
			const interaction = await admin.createCharacterInteraction({
				target_character_id: targetCharacterId as CharacterId,
				character_behavior_type: characterBehaviorType,
				character_id: characterId ? (characterId as CharacterId) : null,
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
					<ButtonGroupText>행동</ButtonGroupText>
					<Select type="single" value={characterBehaviorType} onValueChange={onBehaviorTypeChange}>
						<SelectTrigger class="flex-1">
							{selectedBehaviorLabel}
						</SelectTrigger>
						<SelectContent>
							{#each behaviorTypeOptions as option (option.value)}
								<SelectItem value={option.value}>{option.label}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</ButtonGroup>
			</div>

			<DialogFooter>
				<Button type="submit" disabled={!targetCharacterId || isSubmitting}>
					{isSubmitting ? '생성 중...' : '생성'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
