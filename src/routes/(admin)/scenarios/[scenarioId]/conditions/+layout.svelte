<script lang="ts">
	import ConditionAside from '$lib/components/condition/condition-aside.svelte';

	let { children } = $props();
</script>

<div class="relative h-full">
	<ConditionAside />
	{@render children()}
</div>
