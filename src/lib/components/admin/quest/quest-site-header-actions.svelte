<script lang="ts">
	import { page } from '$app/stores';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import QuestUpdateButton from './quest-update-button.svelte';
	import QuestDeleteButton from './quest-delete-button.svelte';
	import QuestCreateButton from './quest-create-button.svelte';

	const questId = $derived($page.params.questId);
</script>

{#if questId}
	<ButtonGroup.Root>
		<ButtonGroup.Root>
			<QuestCreateButton />
			<QuestUpdateButton {questId} />
		</ButtonGroup.Root>
		<ButtonGroup.Root>
			<QuestDeleteButton {questId} />
		</ButtonGroup.Root>
	</ButtonGroup.Root>
{/if}
