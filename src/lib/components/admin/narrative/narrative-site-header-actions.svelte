<script lang="ts">
	import { page } from '$app/state';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import NarrativeUpdateButton from './narrative-update-button.svelte';
	import NarrativeDeleteButton from './narrative-delete-button.svelte';
	import NarrativeCreateButton from './narrative-create-button.svelte';

	const narrativeId = $derived(page.params.narrativeId);
</script>

<ButtonGroup>
	<ButtonGroup>
		<NarrativeCreateButton />
		{#if narrativeId}
			<NarrativeUpdateButton {narrativeId} />
		{/if}
	</ButtonGroup>
	{#if narrativeId}
		<ButtonGroup>
			<NarrativeDeleteButton {narrativeId} />
		</ButtonGroup>
	{/if}
</ButtonGroup>
