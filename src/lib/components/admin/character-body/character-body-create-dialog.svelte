<script lang="ts">
	import { useCharacter } from '$lib/hooks';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
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
		InputGroupAddon,
		InputGroupInput,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { IconHeading } from '@tabler/icons-svelte';
	import type { ScenarioId } from '$lib/types';
	import { getActionString } from '$lib/utils/label';

	const { characterBodyDialogStore, closeCharacterBodyDialog, admin } = useCharacter();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	let open = $derived($characterBodyDialogStore?.type === 'create');
	let name = $state('');
	let isSubmitting = $state(false);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeCharacterBodyDialog();
			name = '';
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (isSubmitting) return;

		isSubmitting = true;
		admin
			.createCharacterBody(scenarioId, { name: name.trim() })
			.then((body) => {
				goto(`/admin/scenarios/${scenarioId}/character-bodies/${body.id}`);
				closeCharacterBodyDialog();
				name = '';
			})
			.catch((error) => {
				console.error('Failed to create character body:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>새로운 바디</DialogTitle>
		</DialogHeader>
		<form {onsubmit}>
			<InputGroup class="w-full">
				<InputGroupAddon align="inline-start">
					<InputGroupText>
						<IconHeading class="size-4" />
					</InputGroupText>
				</InputGroupAddon>
				<InputGroupInput placeholder="바디 이름" bind:value={name} />
			</InputGroup>
			<DialogFooter class="mt-4">
				<Button type="button" variant="outline" onclick={() => onOpenChange(false)}>{getActionString("cancel")}</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '생성 중...' : '생성'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
