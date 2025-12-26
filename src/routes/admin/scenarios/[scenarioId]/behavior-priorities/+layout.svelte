<script lang="ts">
	import BehaviorPriorityAside from '$lib/components/admin/behavior-priority/behavior-priority-aside.svelte';

	let { children } = $props();
</script>

<div class="relative h-full">
	<BehaviorPriorityAside />
	{@render children()}
</div>
