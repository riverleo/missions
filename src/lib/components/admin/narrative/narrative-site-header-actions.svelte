<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { IconEditCircle, IconTrash } from '@tabler/icons-svelte';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import NarrativeCreateButton from './narrative-create-button.svelte';
	import NarrativeUpdateDialog from './narrative-update-dialog.svelte';
	import NarrativeDeleteDialog from './narrative-delete-dialog.svelte';

	const { openUpdateDialog, openDeleteDialog } = useNarrative();
	const narrativeId = $derived(page.params.narrativeId);

	function onUpdateClick() {
		if (narrativeId) {
			openUpdateDialog(narrativeId);
		}
	}

	function onDeleteClick() {
		if (narrativeId) {
			openDeleteDialog(narrativeId);
		}
	}
</script>

<ButtonGroup>
	<ButtonGroup>
		<NarrativeCreateButton />
		{#if narrativeId}
			<Button onclick={onUpdateClick}>
				<IconEditCircle class="size-4" />
			</Button>
		{/if}
	</ButtonGroup>
	{#if narrativeId}
		<ButtonGroup>
			<Button onclick={onDeleteClick}>
				<IconTrash class="size-4" />
			</Button>
		</ButtonGroup>
	{/if}
</ButtonGroup>

<NarrativeUpdateDialog />
<NarrativeDeleteDialog />
