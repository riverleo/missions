<script lang="ts">
	import BuildingBehaviorAside from '$lib/components/admin/building-behavior/building-behavior-aside.svelte';

	let { children } = $props();
</script>

<div class="relative h-full">
	<BuildingBehaviorAside />
	{@render children()}
</div>
