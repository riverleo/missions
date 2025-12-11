<script lang="ts">
	import Header from '$lib/components/admin/narrative/narrative-header.svelte';

	let { children } = $props();
</script>

<div class="flex flex-1 flex-col">
	<Header />
	{@render children()}
</div>
