<script lang="ts">
	import Header from './header.svelte';

	let { children } = $props();
</script>

<div class="flex flex-1 flex-col">
	<Header />
	{@render children()}
</div>
