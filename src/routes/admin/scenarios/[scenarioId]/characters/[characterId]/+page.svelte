<script lang="ts">
	import { page } from '$app/state';
	import { useCharacter } from '$lib/hooks/use-character';
	import CharacterPanel from '$lib/components/admin/character/character-action-panel.svelte';
	import CharacterStateItemGroup from '$lib/components/admin/character/character-state-item-group.svelte';

	const { store } = useCharacter();
	const characterId = $derived(page.params.characterId);
	const character = $derived(characterId ? $store.data[characterId] : undefined);
</script>

{#if character && characterId}
	<div class="flex h-full flex-col">
		<div class="flex p-4 pt-16">
			<CharacterStateItemGroup {characterId} />
		</div>
		<CharacterPanel {character} />
	</div>
{:else}
	<div class="flex h-full items-center justify-center">
		<p class="text-sm text-muted-foreground">캐릭터를 찾을 수 없습니다</p>
	</div>
{/if}
