<script lang="ts">
	import { useWorldTest } from '$lib/hooks/use-world';

	const { store } = useWorldTest();

	// TODO: 틱 시스템 구현 후 실제 틱 데이터 연결
	const currentTick = $derived(0);

	// TODO: 캐릭터 행동 목록 시스템 구현 후 실제 데이터 연결
	const characterActions = $derived<Array<{ characterId: string; action: string }>>([]);
</script>

<div class="flex flex-col gap-4 p-4">
	<div class="flex flex-col gap-2">
		<h3 class="text-sm font-semibold">틱 정보</h3>
		<div class="rounded-md border bg-muted/50 p-2">
			<p class="text-sm text-muted-foreground">현재 틱: {currentTick}</p>
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<h3 class="text-sm font-semibold">캐릭터 행동 목록</h3>
		<div class="rounded-md border bg-muted/50 p-2">
			{#if characterActions.length > 0}
				<ul class="space-y-1">
					{#each characterActions as { characterId, action } (characterId)}
						<li class="text-sm text-muted-foreground">
							{characterId}: {action}
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-sm text-muted-foreground">행동 중인 캐릭터 없음</p>
			{/if}
		</div>
	</div>
</div>
