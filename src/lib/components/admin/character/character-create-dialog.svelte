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
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { IconHeading } from '@tabler/icons-svelte';
	import { useCharacter } from '$lib/hooks/use-character';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { CharacterBodyId, ScenarioId } from '$lib/types';

	const { admin, characterDialogStore, closeCharacterDialog, characterBodyStore } = useCharacter();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const open = $derived($characterDialogStore?.type === 'create');
	const bodies = $derived(Object.values($characterBodyStore.data));

	let name = $state('');
	let characterBodyId = $state<CharacterBodyId | undefined>(undefined);
	let isSubmitting = $state(false);

	const selectedBodyLabel = $derived(
		characterBodyId
			? (bodies.find((b) => b.id === characterBodyId)?.name ?? '바디 선택')
			: '바디 선택'
	);

	$effect(() => {
		if (open) {
			name = '';
			characterBodyId = undefined;
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeCharacterDialog();
		}
	}

	function onBodyChange(value: string | undefined) {
		characterBodyId = value as CharacterBodyId | undefined;
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim() || !characterBodyId || isSubmitting) return;

		isSubmitting = true;

		admin
			.createCharacter(scenarioId, { name: name.trim(), character_body_id: characterBodyId })
			.then((character) => {
				closeCharacterDialog();
				goto(`/admin/scenarios/${scenarioId}/characters/${character.id}`);
			})
			.catch((error) => {
				console.error('Failed to create character:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>새로운 캐릭터 생성</DialogTitle>
		</DialogHeader>
		<form {onsubmit}>
			<div class="flex flex-col gap-2">
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>
							<IconHeading />
						</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput placeholder="캐릭터 이름" bind:value={name} />
				</InputGroup>
				<ButtonGroup class="w-full">
					<Select type="single" value={characterBodyId} onValueChange={onBodyChange}>
						<SelectTrigger class="w-full">
							{selectedBodyLabel}
						</SelectTrigger>
						<SelectContent>
							{#each bodies as body (body.id)}
								<SelectItem value={body.id}>{body.name}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</ButtonGroup>
			</div>
			{#if bodies.length === 0}
				<p class="mt-4 text-sm text-muted-foreground">먼저 바디를 생성해주세요.</p>
			{/if}
			<DialogFooter class="mt-4">
				<Button type="submit" disabled={isSubmitting || !characterBodyId || !name.trim()}>
					{isSubmitting ? '생성 중...' : '생성하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
