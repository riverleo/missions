<script lang="ts">
	import { page } from '$app/state';
	import { useCharacterBody } from '$lib/hooks/use-character-body';
	import CharacterBodyPanel from '$lib/components/admin/character-body/character-body-action-panel.svelte';
	import CharacterBodyStateItemGroup from '$lib/components/admin/character-body/character-body-state-item-group.svelte';

	const { store } = useCharacterBody();
	const bodyId = $derived(page.params.bodyId);
	const body = $derived(bodyId ? $store.data[bodyId] : undefined);
</script>

{#if body && bodyId}
	<div class="flex h-full flex-col">
		<div class="flex p-4 pt-16">
			<CharacterBodyStateItemGroup {bodyId} />
		</div>
		<CharacterBodyPanel {body} />
	</div>
{:else}
	<div class="flex h-full items-center justify-center">
		<p class="text-sm text-muted-foreground">몸통을 찾을 수 없습니다</p>
	</div>
{/if}
