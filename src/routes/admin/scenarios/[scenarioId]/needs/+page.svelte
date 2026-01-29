<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useCharacter } from '$lib/hooks/use-character';
	import type { ScenarioId } from '$lib/types';
	import { Empty, EmptyContent, EmptyTitle, EmptyDescription } from '$lib/components/ui/empty';

	const { needStore } = useCharacter();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	$effect(() => {
		const needs = Object.values($needStore.data);
		if (needs.length > 0) {
			const firstNeed = needs[0]!;
			goto(`/admin/scenarios/${scenarioId}/needs/${firstNeed.id}`);
		}
	});
</script>

<div class="flex h-full items-center justify-center">
	<Empty>
		<EmptyContent>
			<EmptyTitle>욕구를 선택하세요</EmptyTitle>
			<EmptyDescription>
				왼쪽 목록에서 욕구를 선택하거나 새로운 욕구를 만들어주세요.
			</EmptyDescription>
		</EmptyContent>
	</Empty>
</div>
