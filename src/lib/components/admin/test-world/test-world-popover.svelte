<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Kbd, KbdGroup } from '$lib/components/ui/kbd';
	import World from '$lib/components/app/world/world.svelte';
	import TestWorldCommand from './test-world-command.svelte';
	import TestWorldMarker from './test-world-marker.svelte';
	import TestWorldPanel from './test-world-panel.svelte';
	import { useTestWorld } from '$lib/hooks/use-test-world';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useBuilding } from '$lib/hooks/use-building';

	const { store, restoreTerrain } = useTestWorld();
	const { store: terrainStore } = useTerrain();
	const { store: characterStore } = useCharacter();
	const { store: buildingStore } = useBuilding();

	let open = $state(false);

	// localStorage에서 저장된 terrain ID로 terrain 복원
	$effect(() => {
		restoreTerrain($terrainStore.data);
	});

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

	// 배치된 캐릭터/건물 (WorldContext가 스토어에서 원본 데이터를 조회함)
	const characters = $derived($store.characters);
	const buildings = $derived($store.buildings);
</script>

<Popover bind:open>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button {...props} variant="outline" size="sm">
				테스트 월드
				<KbdGroup><Kbd>⌘</Kbd><Kbd>⇧</Kbd><Kbd>P</Kbd></KbdGroup>
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent class="flex h-[420px] w-[1140px] gap-0 p-0" align="end">
		<!-- 좌측: 커맨드 목록 -->
		<div class="w-80 shrink-0 border-r">
			<TestWorldCommand />
		</div>

		<!-- 우측: 월드 -->
		<div class="relative flex flex-1 items-center justify-center">
			{#if selectedTerrain}
				<World
					class="border-0"
					terrain={selectedTerrain}
					{characters}
					{buildings}
					debug={$store.debug}
				>
					<TestWorldMarker />
				</World>
				<TestWorldPanel />
			{:else}
				<p class="text-sm text-muted-foreground">지형을 선택해주세요</p>
			{/if}
		</div>
	</PopoverContent>
</Popover>
