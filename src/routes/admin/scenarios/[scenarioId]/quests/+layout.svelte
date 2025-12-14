<script lang="ts">
	import ScenarioQuestAside from '$lib/components/admin/scenario-quest/scenario-quest-aside.svelte';

	let { children } = $props();
</script>

<div class="relative h-full">
	<ScenarioQuestAside />
	{@render children()}
</div>
