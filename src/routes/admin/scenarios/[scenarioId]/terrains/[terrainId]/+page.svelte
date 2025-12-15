<script lang="ts">
	import { page } from '$app/state';
	import { useTerrain } from '$lib/hooks/use-terrain';

	const { store } = useTerrain();
	const terrainId = $derived(page.params.terrainId);
	const terrain = $derived(terrainId ? $store.data[terrainId] : undefined);
</script>

<div class="flex h-full items-center justify-center">
	{#if terrain}
		<div class="text-center">
			<h1 class="text-lg font-semibold">{terrain.title || '제목없음'}</h1>
			<p class="text-sm text-muted-foreground">지형 상세 페이지 (수정 기능 추가 예정)</p>
		</div>
	{:else}
		<p class="text-sm text-muted-foreground">지형을 찾을 수 없습니다</p>
	{/if}
</div>
