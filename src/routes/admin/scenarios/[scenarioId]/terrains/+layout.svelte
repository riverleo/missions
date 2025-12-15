<script lang="ts">
	import TerrainAside from '$lib/components/admin/terrain/terrain-aside.svelte';

	let { children } = $props();
</script>

<div class="relative h-full">
	<TerrainAside />
	{@render children()}
</div>
