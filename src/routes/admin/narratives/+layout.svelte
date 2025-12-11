<script lang="ts">
	import Aside from '$lib/components/admin/narrative/narrative-aside.svelte';

	let { children } = $props();
</script>

<div class="flex h-screen">
	<Aside />
	<div class="flex flex-1 flex-col">
		{@render children()}
	</div>
</div>
