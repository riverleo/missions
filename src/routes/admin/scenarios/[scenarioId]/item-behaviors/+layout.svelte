<script lang="ts">
	import ItemBehaviorAside from '$lib/components/admin/item-behavior/item-behavior-aside.svelte';

	let { children } = $props();
</script>

<div class="relative h-full">
	<ItemBehaviorAside />
	{@render children()}
</div>
