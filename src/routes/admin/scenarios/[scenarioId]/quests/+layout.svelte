<script lang="ts">
	import { onMount } from 'svelte';
	import ScenarioQuestAside from '$lib/components/admin/scenario-quest/scenario-quest-aside.svelte';
	import { useAdmin } from '$lib/hooks/use-admin.svelte';
	import { useScenarioQuest } from '$lib/hooks/use-scenario-quest';
	import { page } from '$app/state';

	let { children } = $props();

	const admin = useAdmin();
	const { store } = useScenarioQuest();
	const scenarioQuestId = $derived(page.params.scenarioQuestId);
	const currentScenarioQuest = $derived($store.data?.find((q) => q.id === scenarioQuestId));

	$effect(() => {
		if (currentScenarioQuest) {
			admin.breadcrumbTitle = currentScenarioQuest.title;
		} else {
			admin.breadcrumbTitle = undefined;
		}
	});

	onMount(() => {
		return () => {
			admin.breadcrumbTitle = undefined;
		};
	});
</script>

<div class="relative h-full">
	<ScenarioQuestAside />
	{@render children()}
</div>
