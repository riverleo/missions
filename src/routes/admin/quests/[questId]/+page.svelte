<script lang="ts">
	import Header from './header.svelte';
	import Content from './content.svelte';
	import { SvelteFlowProvider } from '@xyflow/svelte';
</script>

<Header />

<SvelteFlowProvider>
	<Content />
</SvelteFlowProvider>
