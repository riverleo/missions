<script lang="ts">
	import Aside from '$lib/components/admin/narrative/narrative-aside.svelte';

	let { children } = $props();
</script>

<div class="flex h-full">
	<Aside />
	<div class="flex flex-1 flex-col overflow-hidden">
		{@render children()}
	</div>
</div>
