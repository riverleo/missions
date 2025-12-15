<script lang="ts">
	import ChapterSvelteFlow from '$lib/components/admin/chapter/chapter-svelte-flow.svelte';
	import { SvelteFlowProvider } from '@xyflow/svelte';
</script>

<SvelteFlowProvider>
	<ChapterSvelteFlow />
</SvelteFlowProvider>
