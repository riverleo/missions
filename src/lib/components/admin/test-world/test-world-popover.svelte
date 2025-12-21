<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { Kbd, KbdGroup } from '$lib/components/ui/kbd';
	import { IconDeviceGamepad2 } from '@tabler/icons-svelte';
	import World from '$lib/components/app/world/world.svelte';
	import { useTestWorld } from '$lib/hooks/use-test-world';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useBuilding } from '$lib/hooks/use-building';

	const { store } = useTestWorld();
	const { store: terrainStore } = useTerrain();
	const { store: characterStore } = useCharacter();
	const { store: buildingStore } = useBuilding();

	let open = $state(false);

	// 단축키: Ctrl/Cmd + Shift + P
	function onkeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
			e.preventDefault();
			open = !open;
		}
	}

	$effect(() => {
		window.addEventListener('keydown', onkeydown);
		return () => window.removeEventListener('keydown', onkeydown);
	});

	// 선택된 지형의 최신 데이터 가져오기
	const selectedTerrain = $derived(
		$store.selectedTerrain ? $terrainStore.data[$store.selectedTerrain.id] : undefined
	);

	// 배치된 캐릭터/건물의 데이터를 최신 원본 데이터로 교체
	const characters = $derived(
		$store.characters.map((wc) => ({
			...wc,
			character: $characterStore.data[wc.character_id] ?? wc.character,
		}))
	);
	const buildings = $derived(
		$store.buildings.map((wb) => ({
			...wb,
			building: $buildingStore.data[wb.building_id] ?? wb.building,
		}))
	);
</script>

<Popover bind:open>
	<Tooltip>
		<TooltipTrigger>
			{#snippet child({ props })}
				<PopoverTrigger>
					{#snippet child({ props: popoverProps })}
						<Button
							{...props}
							{...popoverProps}
							variant={open ? 'secondary' : 'ghost'}
							size="icon"
						>
							<IconDeviceGamepad2 />
						</Button>
					{/snippet}
				</PopoverTrigger>
			{/snippet}
		</TooltipTrigger>
		<TooltipContent class="flex items-center gap-2">
			월드 미리보기
			<KbdGroup><Kbd>⌘</Kbd><Kbd>⇧</Kbd><Kbd>P</Kbd></KbdGroup>
		</TooltipContent>
	</Tooltip>
	<PopoverContent
		class="h-[420px] w-[820px] p-0"
		align="end"
		onInteractOutside={(e) => e.preventDefault()}
	>
		<div class="flex h-full items-center justify-center">
			{#if selectedTerrain}
				<World terrain={selectedTerrain} {characters} {buildings} debug={$store.debug} />
			{:else}
				<p class="text-sm text-muted-foreground">테스트 메뉴에서 지형을 선택해주세요</p>
			{/if}
		</div>
	</PopoverContent>
</Popover>
