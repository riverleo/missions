<script lang="ts">
	import NeedAside from '$lib/components/admin/need/need-aside.svelte';

	let { children } = $props();
</script>

<div class="relative h-full">
	<NeedAside />
	{@render children()}
</div>
