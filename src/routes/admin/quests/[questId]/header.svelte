<script lang="ts">
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import { page } from '$app/state';
	import QuestUpdateButton from './quest-update-button.svelte';
	import QuestDeleteButton from './quest-delete-button.svelte';

	const questId = $derived(page.params.questId) as string;
	const { store } = useQuest();

	const currentQuest = $derived($store.data?.find((q) => q.id === questId));
</script>

<header class="flex h-16 items-center justify-between border-b px-6">
	<h1 class="text-xl font-semibold">{currentQuest?.title ?? '퀘스트 이름'}</h1>
	<div class="flex gap-2">
		<QuestUpdateButton {questId} />
		<QuestDeleteButton {questId} />
	</div>
</header>
