<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { useScenario } from '$lib/hooks/use-scenario';
	import type { ScenarioId } from '$lib/types';

	let { children } = $props();

	const { store, fetchAll } = useScenario();

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const isValidScenario = $derived(scenarioId ? !!$store.data?.[scenarioId] : false);

	// scenarioId 변경 시 fetchAll 호출 추적
	let lastFetchedScenarioId: string | undefined;

	$effect(() => {
		if ($store.status === 'success' && scenarioId) {
			if (isValidScenario) {
				// URL의 scenarioId가 유효하고 아직 fetch 안했으면 fetchAll 호출
				if (lastFetchedScenarioId !== scenarioId) {
					lastFetchedScenarioId = scenarioId;
					fetchAll(scenarioId);
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
