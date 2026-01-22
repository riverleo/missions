<script lang="ts">
	import { goto } from '$app/navigation';
	import { useScenario } from '$lib/hooks/use-scenario';

	const { scenarioStore } = useScenario();

	// 시나리오 로드 완료 시 첫 번째 시나리오의 챕터 페이지로 리다이렉트
	$effect(() => {
		if ($scenarioStore.status === 'success') {
			const scenarios = Object.values($scenarioStore.data);
			const firstScenario = scenarios[0];
			if (firstScenario) {
				goto(`/admin/scenarios/${firstScenario.id}/chapters`, { replaceState: true });
			}
		}
	});
</script>

<div class="flex h-full items-center justify-center">
	<p class="text-sm text-muted-foreground">로딩 중...</p>
</div>
