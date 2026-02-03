<script lang="ts">
	import { useNarrative } from '$lib/hooks';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId } from '$lib/types';
	import { Empty, EmptyContent, EmptyTitle, EmptyDescription } from '$lib/components/ui/empty';

	const { narrativeStore } = useNarrative();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	$effect(() => {
		const narratives = Object.values($narrativeStore.data);
		if (narratives.length > 0) {
			const firstNarrative = narratives[0]!;
			goto(`/admin/scenarios/${scenarioId}/narratives/${firstNarrative.id}`);
		}
	});
</script>

<div class="flex h-full items-center justify-center">
	<Empty>
		<EmptyContent>
			<EmptyTitle>대화 또는 효과를 선택하세요</EmptyTitle>
			<EmptyDescription>
				왼쪽 목록에서 대화를 선택하거나 새로운 효과를 만들어주세요.
			</EmptyDescription>
		</EmptyContent>
	</Empty>
</div>
