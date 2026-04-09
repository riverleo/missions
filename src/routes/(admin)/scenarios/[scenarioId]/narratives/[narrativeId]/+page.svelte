<script lang="ts">
	import NarrativeSvelteFlow from '$lib/components/narrative/narrative-svelte-flow.svelte';
	import { SvelteFlowProvider } from '@xyflow/svelte';
</script>

<SvelteFlowProvider>
	<NarrativeSvelteFlow />
</SvelteFlowProvider>
