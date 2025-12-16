<script lang="ts">
	import type { CharacterStateType } from '$lib/types';
	import { ItemGroup } from '$lib/components/ui/item';
	import CharacterStateItem from './character-state-item.svelte';

	interface Props {
		characterId: string;
	}

	let { characterId }: Props = $props();

	const stateTypes: CharacterStateType[] = ['idle', 'walk', 'jump'];
</script>

<ItemGroup class="grid grid-cols-4 gap-4">
	{#each stateTypes as type (type)}
		<CharacterStateItem {characterId} {type} />
	{/each}
</ItemGroup>
