<script lang="ts">
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
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { IconHeading } from '@tabler/icons-svelte';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useCharacterBody } from '$lib/hooks/use-character-body';
	import type { CharacterBodyId } from '$lib/types';

	const { store, admin, dialogStore, closeDialog } = useCharacter();
	const { store: bodyStore } = useCharacterBody();

	const open = $derived($dialogStore?.type === 'update');
	const characterId = $derived(
		$dialogStore?.type === 'update' ? $dialogStore.characterId : undefined
	);
	const character = $derived(characterId ? $store.data[characterId] : undefined);
	const bodies = $derived(Object.values($bodyStore.data));

	let name = $state('');
	let characterBodyId = $state<CharacterBodyId | undefined>(undefined);
	let isSubmitting = $state(false);

	const selectedBodyLabel = $derived(
		characterBodyId
			? (bodies.find((b) => b.id === characterBodyId)?.name ?? '바디 선택')
			: '바디 선택'
	);

	$effect(() => {
		if (open && character) {
			name = character.name ?? '';
			characterBodyId = character.character_body_id ?? undefined;
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onBodyChange(value: string | undefined) {
		characterBodyId = value as CharacterBodyId | undefined;
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!characterId || !name.trim() || !characterBodyId || isSubmitting) return;

		isSubmitting = true;

		admin
			.update(characterId, { name: name.trim(), character_body_id: characterBodyId })
			.then(() => {
				closeDialog();
			})
			.catch((error) => {
				console.error('Failed to update character:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>캐릭터 수정</DialogTitle>
		</DialogHeader>
		<form {onsubmit}>
			<ButtonGroup class="w-full">
				<ButtonGroup>
					<ButtonGroupText>바디</ButtonGroupText>
					<Select type="single" value={characterBodyId} onValueChange={onBodyChange}>
						<SelectTrigger>
							{selectedBodyLabel}
						</SelectTrigger>
						<SelectContent>
							{#each bodies as body (body.id)}
								<SelectItem value={body.id}>{body.name}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</ButtonGroup>
				<ButtonGroup class="flex-1">
					<InputGroup>
						<InputGroupAddon align="inline-start">
							<InputGroupText>
								<IconHeading />
							</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput placeholder="캐릭터 이름" bind:value={name} />
					</InputGroup>
				</ButtonGroup>
			</ButtonGroup>
			<DialogFooter class="mt-4">
				<Button type="submit" disabled={isSubmitting || !characterBodyId || !name.trim()}>
					{isSubmitting ? '저장 중...' : '저장'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
