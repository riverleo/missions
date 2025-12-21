<script lang="ts">
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
	import { useCharacterBody } from '$lib/hooks/use-character-body';

	const { dialogStore, closeDialog, admin } = useCharacterBody();
	const scenarioId = $derived(page.params.scenarioId);

	let open = $derived($dialogStore?.type === 'create');
	let name = $state('');
	let isSubmitting = $state(false);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
			name = '';
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (isSubmitting) return;

		isSubmitting = true;
		admin
			.create({ name: name.trim() })
			.then((body) => {
				goto(`/admin/scenarios/${scenarioId}/character-bodies/${body.id}`);
				closeDialog();
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
			<DialogTitle>새로운 몸통</DialogTitle>
		</DialogHeader>
		<form {onsubmit}>
			<InputGroup class="w-full">
				<InputGroupAddon align="inline-start">
					<InputGroupText>
						<IconHeading class="size-4" />
					</InputGroupText>
				</InputGroupAddon>
				<InputGroupInput placeholder="몸통 이름" bind:value={name} />
			</InputGroup>
			<DialogFooter class="mt-4">
				<Button type="button" variant="outline" onclick={() => onOpenChange(false)}>취소</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '생성 중...' : '생성'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
