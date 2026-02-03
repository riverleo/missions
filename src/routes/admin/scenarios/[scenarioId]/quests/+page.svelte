<script lang="ts">
	import { useQuest } from '$lib/hooks';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId } from '$lib/types';
	import { Empty, EmptyContent, EmptyTitle, EmptyDescription } from '$lib/components/ui/empty';

	const { questStore } = useQuest();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	$effect(() => {
		const quests = Object.values($questStore.data);
		if (quests.length > 0) {
			const firstQuest = quests[0]!;
			goto(`/admin/scenarios/${scenarioId}/quests/${firstQuest.id}`);
		}
	});
</script>

<div class="flex h-full items-center justify-center">
	<Empty>
		<EmptyContent>
			<EmptyTitle>퀘스트를 선택하세요</EmptyTitle>
			<EmptyDescription>
				왼쪽 목록에서 퀘스트를 선택하거나 새로운 퀘스트를 만들어주세요.
			</EmptyDescription>
		</EmptyContent>
	</Empty>
</div>
