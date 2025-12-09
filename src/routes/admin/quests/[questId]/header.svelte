<script lang="ts">
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import { page } from '$app/stores';
	import QuestUpdateButton from './quest-update-button.svelte';
	import QuestDeleteButton from './quest-delete-button.svelte';

	const questId = $derived($page.params.questId);
	const { quests } = useQuest();

	const currentQuest = $derived($quests.data?.find((q) => q.id === questId));
</script>

<header class="h-16 border-b px-6 flex items-center justify-between">
	<h1 class="text-xl font-semibold">{currentQuest?.title ?? '퀘스트 이름'}</h1>
	{#if questId}
		<div class="flex gap-2">
			<QuestUpdateButton {questId} />
			<QuestDeleteButton {questId} />
		</div>
	{/if}
</header>
