<script lang="ts">
	import { page } from '$app/stores';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import QuestUpdateButton from './quest-update-button.svelte';
	import QuestDeleteButton from './quest-delete-button.svelte';
	import QuestCreateButton from './quest-create-button.svelte';

	const questId = $derived($page.params.questId);
</script>

<ButtonGroup>
	<ButtonGroup>
		<QuestCreateButton />
		{#if questId}
			<QuestUpdateButton {questId} />
		{/if}
	</ButtonGroup>
	{#if questId}
		<ButtonGroup>
			<QuestDeleteButton {questId} />
		</ButtonGroup>
	{/if}
</ButtonGroup>
