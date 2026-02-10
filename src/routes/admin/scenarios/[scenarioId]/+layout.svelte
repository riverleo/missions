<script lang="ts">
	import { useScenario } from '$lib/hooks';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import type { ScenarioId } from '$lib/types';

	let { children } = $props();

	const { scenarioStore, fetchAllStatus, admin } = useScenario();

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
	{#if $fetchAllStatus === 'loading'}
		<div class="flex h-screen items-center justify-center">
			<div class="text-muted-foreground">데이터를 불러오는 중...</div>
		</div>
	{:else if $fetchAllStatus === 'error'}
		<div class="flex h-screen items-center justify-center">
			<div class="text-destructive">데이터를 불러오는데 실패했습니다.</div>
		</div>
	{:else if $fetchAllStatus === 'success'}
		{@render children()}
	{/if}
{/if}
