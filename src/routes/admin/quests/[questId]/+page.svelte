<script lang="ts">
	import Header from '$lib/components/admin/quest/quest-header.svelte';
	import Content from '$lib/components/admin/quest/quest-content.svelte';
	import { SvelteFlowProvider } from '@xyflow/svelte';
</script>

<Header />

<SvelteFlowProvider>
	<Content />
</SvelteFlowProvider>
