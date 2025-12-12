<script lang="ts">
	import { onMount } from 'svelte';
	import QuestAside from '$lib/components/admin/quest/quest-aside.svelte';
	import { useAdmin } from '$lib/hooks/use-admin.svelte';
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import { page } from '$app/state';

	let { children } = $props();

	const admin = useAdmin();
	const { store } = useQuest();
	const questId = $derived(page.params.questId);
	const currentQuest = $derived($store.data?.find((q) => q.id === questId));

	$effect(() => {
		if (currentQuest) {
			admin.breadcrumbTitle = currentQuest.title;
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
	<QuestAside />
	{@render children()}
</div>
