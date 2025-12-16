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
	} from '$lib/components/ui/input-group';
	import { IconUser } from '@tabler/icons-svelte';
	import { useCharacter } from '$lib/hooks/use-character';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	const { admin, dialogStore, closeDialog } = useCharacter();
	const scenarioId = $derived(page.params.scenarioId);

	const open = $derived($dialogStore?.type === 'create');

	let name = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (open) {
			name = '';
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.create({ name: name.trim() })
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
		<form {onsubmit} class="space-y-6">
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<IconUser class="size-4" />
				</InputGroupAddon>
				<InputGroupInput placeholder="이름" bind:value={name} />
			</InputGroup>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '생성 중...' : '생성하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
