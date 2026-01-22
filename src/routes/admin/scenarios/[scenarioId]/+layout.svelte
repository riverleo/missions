<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { useScenario } from '$lib/hooks/use-scenario';
	import type { ScenarioId } from '$lib/types';

	let { children } = $props();

	const { scenarioStore, admin } = useScenario();

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const isValidScenario = $derived(scenarioId ? !!$scenarioStore.data?.[scenarioId] : false);

	// fetchAll은 한 번만 호출 (모든 마스터 데이터를 가져옴)
	let hasFetchedAll = false;

	$effect(() => {
		if ($scenarioStore.status === 'success' && scenarioId) {
			if (isValidScenario) {
				// 아직 fetch 안했으면 fetchAll 호출
				if (!hasFetchedAll) {
					hasFetchedAll = true;
					admin.fetchAll();
				}
			} else {
				// 유효하지 않은 scenarioId면 /admin으로 리다이렉트
				goto('/admin');
			}
		}
	});
</script>

{#if isValidScenario}
	{@render children()}
{/if}
