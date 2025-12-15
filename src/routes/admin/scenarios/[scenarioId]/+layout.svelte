<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { useScenario } from '$lib/hooks/use-scenario';

	let { children } = $props();

	const { store, init } = useScenario();

	const scenarioId = $derived(page.params.scenarioId);
	const isValidScenario = $derived(scenarioId ? !!$store.data?.[scenarioId] : false);

	// scenarioId 변경 시 init 호출 추적
	let lastInitedScenarioId: string | undefined;

	$effect(() => {
		if ($store.status === 'success' && scenarioId) {
			if (isValidScenario) {
				// URL의 scenarioId가 유효하고 아직 init 호출 안했으면 init 호출
				if (lastInitedScenarioId !== scenarioId) {
					lastInitedScenarioId = scenarioId;
					init(scenarioId);
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
