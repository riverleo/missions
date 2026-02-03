<script lang="ts">
	import { useBehavior } from '$lib/hooks';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ScenarioId } from '$lib/types';
	import { Empty, EmptyContent, EmptyTitle, EmptyDescription } from '$lib/components/ui/empty';

	const { needBehaviorStore } = useBehavior();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	$effect(() => {
		const behaviors = Object.values($needBehaviorStore.data);
		if (behaviors.length > 0) {
			const firstBehavior = behaviors[0]!;
			goto(`/admin/scenarios/${scenarioId}/need-behaviors/${firstBehavior.id}`);
		}
	});
</script>

<div class="flex h-full items-center justify-center">
	<Empty>
		<EmptyContent>
			<EmptyTitle>욕구 행동을 선택하세요</EmptyTitle>
			<EmptyDescription>
				왼쪽 목록에서 욕구 행동을 선택하거나 새로운 행동을 만들어주세요.
			</EmptyDescription>
		</EmptyContent>
	</Empty>
</div>
