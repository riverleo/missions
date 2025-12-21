<script lang="ts">
	import { useCharacterBody } from '$lib/hooks/use-character-body';

	const { store } = useCharacterBody();
	const bodies = $derived(Object.values($store.data));
</script>

<div class="flex h-full items-center justify-center">
	{#if bodies.length === 0}
		<p class="text-sm text-muted-foreground">바디를 추가해주세요</p>
	{:else}
		<p class="text-sm text-muted-foreground">바디를 선택해주세요</p>
	{/if}
</div>
