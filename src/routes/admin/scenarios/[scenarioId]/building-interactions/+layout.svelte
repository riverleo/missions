<script lang="ts">
	import BuildingInteractionAside from '$lib/components/admin/building-interaction/building-interaction-aside.svelte';

	let { children } = $props();
</script>

<div class="relative h-full">
	<BuildingInteractionAside />
	{@render children()}
</div>
