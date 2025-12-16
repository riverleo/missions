<script lang="ts">
	import { useCharacter } from '$lib/hooks/use-character';

	const { store } = useCharacter();
	const characters = $derived(Object.values($store.data));
</script>

<div class="flex h-full items-center justify-center">
	{#if characters.length === 0}
		<p class="text-sm text-muted-foreground">캐릭터를 추가해주세요</p>
	{:else}
		<p class="text-sm text-muted-foreground">캐릭터를 선택해주세요</p>
	{/if}
</div>
