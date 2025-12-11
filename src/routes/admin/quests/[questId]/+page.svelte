<script lang="ts">
	import Header from '$lib/components/admin/quest/quest-header.svelte';
	import QuestSvelteFlow from '$lib/components/admin/quest/quest-svelte-flow.svelte';
	import { SvelteFlowProvider } from '@xyflow/svelte';
</script>

<Header />

<SvelteFlowProvider>
	<QuestSvelteFlow />
</SvelteFlowProvider>
