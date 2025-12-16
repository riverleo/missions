<script lang="ts">
	import {
		Command,
		CommandInput,
		CommandList,
		CommandEmpty,
		CommandGroup,
		CommandItem,
	} from '$lib/components/ui/command';
	import { IconCheck, IconMap } from '@tabler/icons-svelte';
	import { cn } from '$lib/utils';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useTestWorld } from '$lib/hooks/use-test-world';
	import { useServerPayload } from '$lib/hooks/use-server-payload.svelte';
	import { getGameAssetUrl } from '$lib/utils/storage';
	import { sort, alphabetical } from 'radash';

	const { supabase } = useServerPayload();
	const { store: terrainStore } = useTerrain();
	const { store: characterStore } = useCharacter();
	const { store: buildingStore } = useBuilding();
	const { store: testWorldStore, selectTerrain, selectCharacter, selectBuilding } = useTestWorld();

	const terrains = $derived(sort(Object.values($terrainStore.data), (t) => t.display_order));
	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));
	const buildings = $derived(alphabetical(Object.values($buildingStore.data), (b) => b.name));
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="검색..." />
	<CommandList class="max-h-96">
		<CommandEmpty />
		{#if terrains.length > 0}
			<CommandGroup heading="지형">
				{#each terrains as terrain (terrain.id)}
					{@const assetUrl = getGameAssetUrl(supabase, 'terrain', terrain)}
					<CommandItem onSelect={() => selectTerrain(terrain)}>
						<IconCheck
							class={cn(
								'mr-2 size-4',
								terrain.id === $testWorldStore.selectedTerrain?.id ? 'opacity-100' : 'opacity-0'
							)}
						/>
						{#if assetUrl}
							<img src={assetUrl} alt="" class="mr-2 size-6 rounded object-cover" />
						{:else}
							<IconMap class="mr-2 size-6 text-muted-foreground" />
						{/if}
						<span class="flex-1 truncate">
							{terrain.title || `제목없음 (${terrain.id.split('-')[0]})`}
						</span>
					</CommandItem>
				{/each}
			</CommandGroup>
		{/if}
		{#if characters.length > 0}
			<CommandGroup heading="캐릭터">
				{#each characters as character (character.id)}
					<CommandItem onSelect={() => selectCharacter(character)}>
						<IconCheck
							class={cn(
								'mr-2 size-4',
								character.id === $testWorldStore.selectedCharacter?.id ? 'opacity-100' : 'opacity-0'
							)}
						/>
						<span class="flex-1 truncate">
							{character.name || `이름없음 (${character.id.split('-')[0]})`}
						</span>
					</CommandItem>
				{/each}
			</CommandGroup>
		{/if}
		{#if buildings.length > 0}
			<CommandGroup heading="건물">
				{#each buildings as building (building.id)}
					<CommandItem onSelect={() => selectBuilding(building)}>
						<IconCheck
							class={cn(
								'mr-2 size-4',
								building.id === $testWorldStore.selectedBuilding?.id ? 'opacity-100' : 'opacity-0'
							)}
						/>
						<span class="flex-1 truncate">
							{building.name || `이름없음 (${building.id.split('-')[0]})`}
						</span>
					</CommandItem>
				{/each}
			</CommandGroup>
		{/if}
	</CommandList>
</Command>
