<script lang="ts">
	import QuestAside from '$lib/components/quest/quest-aside.svelte';

	let { children } = $props();
</script>

<div class="relative h-full">
	<QuestAside />
	{@render children()}
</div>
