<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useBuilding } from '$lib/hooks/use-building';
	import type { ScenarioId } from '$lib/types';
	import { Empty, EmptyContent, EmptyTitle, EmptyDescription } from '$lib/components/ui/empty';

	const { conditionStore } = useBuilding();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	$effect(() => {
		const conditions = Object.values($conditionStore.data);
		if (conditions.length > 0) {
			const firstCondition = conditions[0]!;
			goto(`/admin/scenarios/${scenarioId}/conditions/${firstCondition.id}`);
		}
	});
</script>

<div class="flex h-full items-center justify-center">
	<Empty>
		<EmptyContent>
			<EmptyTitle>컨디션을 선택하세요</EmptyTitle>
			<EmptyDescription>
				왼쪽 목록에서 컨디션을 선택하거나 새로운 컨디션을 만들어주세요.
			</EmptyDescription>
		</EmptyContent>
	</Empty>
</div>
