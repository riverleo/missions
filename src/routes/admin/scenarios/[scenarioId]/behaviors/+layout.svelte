<script lang="ts">
	import NeedBehaviorAside from '$lib/components/admin/need-behavior/need-behavior-aside.svelte';

	let { children } = $props();
</script>

<div class="relative h-full">
	<NeedBehaviorAside />
	{@render children()}
</div>
