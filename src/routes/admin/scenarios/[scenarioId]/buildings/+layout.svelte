<script lang="ts">
	import BuildingAside from '$lib/components/admin/building/building-aside.svelte';

	let { children } = $props();
</script>

<div class="relative h-full">
	<BuildingAside />
	{@render children()}
</div>
