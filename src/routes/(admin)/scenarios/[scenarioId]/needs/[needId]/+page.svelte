<script lang="ts">
	import NeedSvelteFlow from '$lib/components/need/need-svelte-flow.svelte';
	import { SvelteFlowProvider } from '@xyflow/svelte';
</script>

<SvelteFlowProvider>
	<NeedSvelteFlow />
</SvelteFlowProvider>
