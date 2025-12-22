<script lang="ts">
	import ItemAside from '$lib/components/admin/item/item-aside.svelte';

	let { children } = $props();
</script>

<div class="relative h-full">
	<ItemAside />
	{@render children()}
</div>
