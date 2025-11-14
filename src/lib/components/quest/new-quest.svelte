<script lang="ts">
	import { setContext } from 'svelte';
	import NewQuestTrigger from './new-quest-trigger.svelte';
	import NewQuestContent from './new-quest-content.svelte';
	import type { NewQuestContext } from '.';

	let ctx = $state<NewQuestContext>({ open: false });

	setContext('new-quest-context', ctx);
</script>

<NewQuestTrigger />

{#if ctx.open}
	<NewQuestContent />
{/if}
