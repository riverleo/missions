<script lang="ts">
	import ConditionBehaviorAside from '$lib/components/admin/condition-behavior/condition-behavior-aside.svelte';

	let { children } = $props();
</script>

<div class="relative h-full">
	<ConditionBehaviorAside />
	{@render children()}
</div>
