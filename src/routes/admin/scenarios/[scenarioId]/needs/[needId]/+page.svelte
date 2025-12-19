<script lang="ts">
	import NeedSvelteFlow from '$lib/components/admin/need/need-svelte-flow.svelte';
	import { SvelteFlowProvider } from '@xyflow/svelte';
</script>

<SvelteFlowProvider>
	<NeedSvelteFlow />
</SvelteFlowProvider>
