<script lang="ts">
	import { useBehavior, useCharacter } from '$lib/hooks';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupButton,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuRadioGroup,
		DropdownMenuRadioItem,
	} from '$lib/components/ui/dropdown-menu';
	import { IconChevronDown, IconHeading } from '@tabler/icons-svelte';
	import { alphabetical } from 'radash';
	import type { NeedId, CharacterId, CharacterFaceStateType } from '$lib/types';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import {
		getFallbackString,
		getActionString,
		getFormString,
		getCharacterFaceStateLabels,
		getCharacterFaceStateString,
	} from '$lib/utils/label';

	const { needBehaviorDialogStore, closeNeedBehaviorDialog, getNeedBehavior, admin } =
		useBehavior();
	const { needStore } = useCharacter();
	const { characterStore } = useCharacter();

	const open = $derived($needBehaviorDialogStore?.type === 'update');
	const needBehaviorId = $derived(
		$needBehaviorDialogStore?.type === 'update'
			? $needBehaviorDialogStore.needBehaviorId
			: undefined
	);
	const currentBehavior = $derived(needBehaviorId ? getNeedBehavior(needBehaviorId) : undefined);
	const needs = $derived(alphabetical(Object.values($needStore.data), (n) => n.name));
	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));

	let name = $state('');
	let needId = $state<string | undefined>(undefined);
	let needThreshold = $state(0);
	let characterId = $state<string | undefined>(undefined);
	let characterFaceStateType = $state<CharacterFaceStateType>('idle');
	let isSubmitting = $state(false);

	const selectedNeed = $derived(needs.find((n) => n.id === needId));
	const selectedNeedName = $derived(selectedNeed?.name ?? '욕구 선택');
	const selectedCharacter = $derived(characters.find((c) => c.id === characterId));
	const selectedCharacterName = $derived(selectedCharacter?.name ?? getFallbackString('all'));

	$effect(() => {
		if (open && currentBehavior) {
			name = currentBehavior.name;
			needId = currentBehavior.need_id;
			needThreshold = currentBehavior.need_threshold;
			characterId = currentBehavior.character_id ?? undefined;
			characterFaceStateType = currentBehavior.character_face_state_type;
		}
	});

	function onNeedChange(value: string) {
		needId = value || undefined;
	}

	function onCharacterChange(value: string | undefined) {
		characterId = value || undefined;
	}

	function onFaceStateChange(value: string | undefined) {
		if (value) {
			characterFaceStateType = value as CharacterFaceStateType;
		}
	}

	function onOpenChange(value: boolean) {
		if (!value) {
			closeNeedBehaviorDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!needBehaviorId || !name.trim() || !needId || isSubmitting) return;

		isSubmitting = true;

		admin
			.updateNeedBehavior(needBehaviorId, {
				name: name.trim(),
				need_id: needId as NeedId,
				need_threshold: needThreshold,
				character_id: characterId as CharacterId | undefined,
				character_face_state_type: characterFaceStateType,
			})
			.then(() => {
				closeNeedBehaviorDialog();
			})
			.catch((error) => {
				console.error('Failed to update behavior:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>욕구 행동 수정</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>
							<IconHeading />
						</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput placeholder={getFormString("name")} bind:value={name} />
				</InputGroup>
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<DropdownMenu>
							<DropdownMenuTrigger>
								{#snippet child({ props })}
									<InputGroupButton {...props} variant="ghost">
										{selectedNeedName}
										<IconChevronDown class="ml-1 size-4" />
									</InputGroupButton>
								{/snippet}
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start">
								<DropdownMenuRadioGroup value={needId ?? ''} onValueChange={onNeedChange}>
									{#each needs as need (need.id)}
										<DropdownMenuRadioItem value={need.id}>{need.name}</DropdownMenuRadioItem>
									{/each}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</InputGroupAddon>
					<InputGroupInput
						type="number"
						placeholder="0"
						step="1"
						min="0"
						max={selectedNeed?.max_value ?? 100}
						bind:value={needThreshold}
					/>
					<InputGroupAddon align="inline-end">
						<InputGroupText>/ {selectedNeed?.max_value ?? 100} 이하</InputGroupText>
					</InputGroupAddon>
				</InputGroup>
				<ButtonGroup class="w-full">
					<ButtonGroupText>캐릭터</ButtonGroupText>
					<Select type="single" value={characterId ?? ''} onValueChange={onCharacterChange}>
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
					<ButtonGroupText>표정</ButtonGroupText>
					<Select type="single" value={characterFaceStateType} onValueChange={onFaceStateChange}>
						<SelectTrigger class="flex-1">
							{getCharacterFaceStateString(characterFaceStateType)}
						</SelectTrigger>
						<SelectContent>
							{#each getCharacterFaceStateLabels() as option (option.value)}
								<SelectItem value={option.value}>{option.label}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</ButtonGroup>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !needId || !name.trim()}>
					{isSubmitting ? getActionString('updating') : getActionString('updateAction')}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
