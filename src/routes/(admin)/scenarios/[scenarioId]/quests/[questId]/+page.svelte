<script lang="ts">
	import QuestSvelteFlow from '$lib/components/quest/quest-svelte-flow.svelte';
	import { SvelteFlowProvider } from '@xyflow/svelte';
</script>

<SvelteFlowProvider>
	<QuestSvelteFlow />
</SvelteFlowProvider>
