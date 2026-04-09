<script lang="ts">
	import ItemInteractionAside from '$lib/components/item-interaction/item-interaction-aside.svelte';

	let { children } = $props();
</script>

<div class="relative h-full">
	<ItemInteractionAside />
	{@render children()}
</div>
