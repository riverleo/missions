<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { IconEditCircle, IconTrash } from '@tabler/icons-svelte';
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import QuestCreateButton from './quest-create-button.svelte';
	import QuestUpdateDialog from './quest-update-dialog.svelte';
	import QuestDeleteDialog from './quest-delete-dialog.svelte';

	const { openUpdateDialog, openDeleteDialog } = useQuest();
	const questId = $derived(page.params.questId);

	function onUpdateClick() {
		if (questId) {
			openUpdateDialog(questId);
		}
	}

	function onDeleteClick() {
		if (questId) {
			openDeleteDialog(questId);
		}
	}
</script>

<ButtonGroup>
	<ButtonGroup>
		<QuestCreateButton />
		{#if questId}
			<Button onclick={onUpdateClick}>
				<IconEditCircle class="size-4" />
			</Button>
		{/if}
	</ButtonGroup>
	{#if questId}
		<ButtonGroup>
			<Button onclick={onDeleteClick}>
				<IconTrash class="size-4" />
			</Button>
		</ButtonGroup>
	{/if}
</ButtonGroup>

<QuestUpdateDialog />
<QuestDeleteDialog />
