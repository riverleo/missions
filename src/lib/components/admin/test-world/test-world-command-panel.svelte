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
	import { EntityIdUtils } from '$lib/utils/entity-id';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useItem } from '$lib/hooks/use-item';
	import { useWorldTest } from '$lib/hooks/use-world';
	import { useApp } from '$lib/hooks/use-app.svelte';
	import { getGameAssetUrl } from '$lib/utils/storage.svelte';
	import { sort, alphabetical } from 'radash';
	import type { WorldContext } from '$lib/components/app/world/context';

	interface Props {
		worldContext?: WorldContext;
	}

	let { worldContext }: Props = $props();

	const { supabase } = useApp();
	const { terrainStore, tileStore } = useTerrain();
	const { characterStore } = useCharacter();
	const { buildingStore } = useBuilding();
	const { itemStore } = useItem();
	const { store, setSelectedTerrainId } = useWorldTest();

	const terrains = $derived(sort(Object.values($terrainStore.data), (t) => t.display_order));
	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));
	const buildings = $derived(alphabetical(Object.values($buildingStore.data), (b) => b.name));
	const items = $derived(alphabetical(Object.values($itemStore.data), (i) => i.name));
	const tiles = $derived(alphabetical(Object.values($tileStore.data), (t) => t.name));
</script>

<Command class="h-full w-full rounded-none border-none bg-transparent">
	<CommandInput placeholder="검색..." />
	<CommandList class="max-h-none flex-1">
		<CommandEmpty />
		{#if terrains.length > 0}
			<CommandGroup heading="지형">
				{#each terrains as terrain (terrain.id)}
					{@const assetUrl = getGameAssetUrl(supabase, 'terrain', terrain)}
					<CommandItem onSelect={() => setSelectedTerrainId(terrain.id)}>
						<IconCheck
							class={cn(
								'mr-2 size-4',
								terrain.id === $store.selectedTerrainId ? 'opacity-100' : 'opacity-0'
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
					{@const templateId = EntityIdUtils.source.create('character', character.id)}
					<CommandItem
						onSelect={() =>
							worldContext?.blueprint.setCursor(
								templateId === worldContext?.blueprint.cursor?.entitySourceTargetId
									? undefined
									: templateId
							)}
					>
						<IconCheck
							class={cn(
								'mr-2 size-4',
								templateId === worldContext?.blueprint.cursor?.entitySourceTargetId
									? 'opacity-100'
									: 'opacity-0'
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
					{@const templateId = EntityIdUtils.source.create('building', building.id)}
					<CommandItem
						onSelect={() =>
							worldContext?.blueprint.setCursor(
								templateId === worldContext?.blueprint.cursor?.entitySourceTargetId
									? undefined
									: templateId
							)}
					>
						<IconCheck
							class={cn(
								'mr-2 size-4',
								templateId === worldContext?.blueprint.cursor?.entitySourceTargetId
									? 'opacity-100'
									: 'opacity-0'
							)}
						/>
						<span class="flex-1 truncate">
							{building.name || `이름없음 (${building.id.split('-')[0]})`}
						</span>
					</CommandItem>
				{/each}
			</CommandGroup>
		{/if}
		{#if items.length > 0}
			<CommandGroup heading="아이템">
				{#each items as item (item.id)}
					{@const templateId = EntityIdUtils.source.create('item', item.id)}
					<CommandItem
						onSelect={() =>
							worldContext?.blueprint.setCursor(
								templateId === worldContext?.blueprint.cursor?.entitySourceTargetId
									? undefined
									: templateId
							)}
					>
						<IconCheck
							class={cn(
								'mr-2 size-4',
								templateId === worldContext?.blueprint.cursor?.entitySourceTargetId
									? 'opacity-100'
									: 'opacity-0'
							)}
						/>
						<span class="flex-1 truncate">
							{item.name || `이름없음 (${item.id.split('-')[0]})`}
						</span>
					</CommandItem>
				{/each}
			</CommandGroup>
		{/if}
		{#if tiles.length > 0}
			<CommandGroup heading="타일">
				{#each tiles as tile (tile.id)}
					{@const templateId = EntityIdUtils.source.create('tile', tile.id)}
					<CommandItem
						onSelect={() =>
							worldContext?.blueprint.setCursor(
								templateId === worldContext?.blueprint.cursor?.entitySourceTargetId
									? undefined
									: templateId
							)}
					>
						<IconCheck
							class={cn(
								'mr-2 size-4',
								templateId === worldContext?.blueprint.cursor?.entitySourceTargetId
									? 'opacity-100'
									: 'opacity-0'
							)}
						/>
						<span class="flex-1 truncate">
							{tile.name || `이름없음 (${tile.id.split('-')[0]})`}
						</span>
					</CommandItem>
				{/each}
			</CommandGroup>
		{/if}
	</CommandList>
</Command>
