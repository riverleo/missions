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
	import { useCharacterBody } from '$lib/hooks/use-character-body';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { CharacterBodyId, ScenarioId } from '$lib/types';

	const { admin, dialogStore, closeDialog } = useCharacter();
	const { store: bodyStore } = useCharacterBody();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const open = $derived($dialogStore?.type === 'create');
	const bodies = $derived(Object.values($bodyStore.data));

	let name = $state('');
	let bodyId = $state<string | undefined>(undefined);
	let isSubmitting = $state(false);

	const selectedBodyLabel = $derived(
		bodyId ? (bodies.find((b) => b.id === bodyId)?.name ?? '바디 선택') : '바디 선택'
	);

	$effect(() => {
		if (open) {
			name = '';
			bodyId = undefined;
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onBodyChange(value: string | undefined) {
		bodyId = value;
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim() || !bodyId || isSubmitting) return;

		isSubmitting = true;

		admin
			.create({ name: name.trim(), body_id: bodyId as CharacterBodyId })
			.then((character) => {
				closeDialog();
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
			<ButtonGroup class="w-full">
				<ButtonGroup>
					<Select type="single" value={bodyId} onValueChange={onBodyChange}>
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
			{#if bodies.length === 0}
				<p class="mt-4 text-sm text-muted-foreground">먼저 바디를 생성해주세요.</p>
			{/if}
			<DialogFooter class="mt-4">
				<Button type="submit" disabled={isSubmitting || !bodyId || !name.trim()}>
					{isSubmitting ? '생성 중...' : '생성하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
