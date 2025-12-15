<script lang="ts">
	import NarrativeAside from '$lib/components/admin/narrative/narrative-aside.svelte';

	let { children } = $props();
</script>

<div class="relative h-full">
	<NarrativeAside />
	{@render children()}
</div>
