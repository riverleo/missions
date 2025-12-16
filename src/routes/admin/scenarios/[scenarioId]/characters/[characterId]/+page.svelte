<script lang="ts">
	import { page } from '$app/state';
	import { useCharacter } from '$lib/hooks/use-character';
	import CharacterPanel from '$lib/components/admin/character/character-panel.svelte';

	const { store } = useCharacter();
	const characterId = $derived(page.params.characterId);
	const character = $derived(characterId ? $store.data[characterId] : undefined);
</script>

<div class="relative flex h-full items-center justify-center">
	{#if character}
		<CharacterPanel {character} />
	{:else}
		<p class="text-sm text-muted-foreground">캐릭터를 찾을 수 없습니다</p>
	{/if}
</div>
