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
	import { alphabetical } from 'radash';
	import type { CharacterId, BehaviorInteractType } from '$lib/types';

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

	let targetCharacterId = $state<string>('');
	let characterBehaviorType = $state<BehaviorInteractType>('building_execute');
	let characterId = $state<string>('');
	let isSubmitting = $state(false);

	const behaviorTypeOptions: { value: BehaviorInteractType; label: string }[] = [
		{ value: 'building_demolish', label: '철거' },
		{ value: 'building_execute', label: '사용' },
		{ value: 'building_repair', label: '수리' },
		{ value: 'building_clean', label: '청소' },
		{ value: 'item_pick', label: '줍기' },
	];

	const selectedTargetCharacter = $derived(characters.find((c) => c.id === targetCharacterId));
	const selectedTargetCharacterName = $derived(selectedTargetCharacter?.name ?? '대상 캐릭터 선택');
	const selectedCharacter = $derived(characters.find((c) => c.id === characterId));
	const selectedCharacterName = $derived(selectedCharacter?.name ?? '모두');
	const selectedBehaviorLabel = $derived(
		behaviorTypeOptions.find((o) => o.value === characterBehaviorType)?.label ?? '사용'
	);

	// interaction이 변경될 때 폼 초기화
	$effect(() => {
		if (interaction) {
			targetCharacterId = interaction.target_character_id;
			characterBehaviorType = interaction.behavior_interact_type;
			characterId = interaction.character_id || '';
		}
	});

	function onTargetCharacterChange(value: string | undefined) {
		targetCharacterId = value || '';
	}

	function onBehaviorTypeChange(value: string | undefined) {
		if (value) {
			characterBehaviorType = value as BehaviorInteractType;
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
		if (!interactionId || !targetCharacterId || isSubmitting) return;

		isSubmitting = true;

		try {
			await admin.updateCharacterInteraction(interactionId, {
				target_character_id: targetCharacterId as CharacterId,
				behavior_interact_type: characterBehaviorType,
				character_id: characterId ? (characterId as CharacterId) : null,
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
					{isSubmitting ? '수정 중...' : '수정'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
