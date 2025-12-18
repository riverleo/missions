<script lang="ts">
	import World from '$lib/components/app/world/world.svelte';
	import TestWorldPanel from '$lib/components/admin/test-world/test-world-panel.svelte';
	import TestWorldAside from '$lib/components/admin/test-world/test-world-aside.svelte';
	import TestWorldMarker from '$lib/components/admin/test-world/test-world-marker.svelte';
	import { useTestWorld } from '$lib/hooks/use-test-world';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useBuilding } from '$lib/hooks/use-building';

	const { store, setCamera } = useTestWorld();
	const { store: terrainStore } = useTerrain();
	const { store: characterStore } = useCharacter();
	const { store: buildingStore } = useBuilding();

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

	function oncamerachange(camera: { x: number; y: number; zoom: number }) {
		setCamera(camera.x, camera.y, camera.zoom);
	}
</script>

<div class="relative flex h-full items-center justify-center">
	{#if selectedTerrain}
		<World
			terrain={selectedTerrain}
			{characters}
			{buildings}
			debug={$store.debug}
			{oncamerachange}
		>
			<TestWorldMarker />
		</World>
	{/if}
	<TestWorldPanel />
	<TestWorldAside />
</div>
