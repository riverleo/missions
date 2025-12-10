<script lang="ts">
	import Aside from './aside.svelte';

	let { children } = $props();
</script>

<div class="flex h-full">
	<Aside />
	{@render children()}
</div>
