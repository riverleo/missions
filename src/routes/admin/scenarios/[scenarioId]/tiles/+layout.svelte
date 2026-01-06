<script lang="ts">
	import TileAside from '$lib/components/admin/tile/tile-aside.svelte';

	let { children } = $props();
</script>

<div class="relative h-full">
	<TileAside />
	{@render children()}
</div>
