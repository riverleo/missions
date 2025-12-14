<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { useScenario } from '$lib/hooks/use-scenario';

	let { children } = $props();

	const { store, init } = useScenario();

	const scenarioId = $derived(page.params.scenarioId);
	const isValidScenario = $derived(scenarioId ? !!$store.data?.[scenarioId] : false);

	$effect(() => {
		if ($store.status === 'success' && scenarioId) {
			if (isValidScenario) {
				// URL의 scenarioId가 유효하면 init 호출
				if ($store.currentScenarioId !== scenarioId) {
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
