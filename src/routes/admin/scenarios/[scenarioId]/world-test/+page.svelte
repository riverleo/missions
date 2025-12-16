<script lang="ts">
	import World from '$lib/components/app/world/world.svelte';
	import TestWorldPanel from '$lib/components/admin/test-world/test-world-panel.svelte';
	import TestWorldAside from '$lib/components/admin/test-world/test-world-aside.svelte';
	import TestWorldMarker from '$lib/components/admin/test-world/test-world-marker.svelte';
	import { useTestWorld } from '$lib/hooks/use-test-world';

	const { store, setCamera } = useTestWorld();

	function oncamerachange(camera: { x: number; y: number; zoom: number }) {
		setCamera(camera.x, camera.y, camera.zoom);
	}
</script>

<div class="relative flex h-full items-center justify-center">
	<div class="h-[400px] w-[800px]">
		<World
			terrain={$store.selectedTerrain}
			characters={$store.characters}
			buildings={$store.buildings}
			worldWidth={$store.worldWidth}
			worldHeight={$store.worldHeight}
			debug={$store.debug}
			{oncamerachange}
		>
			<TestWorldMarker />
		</World>
	</div>
	<TestWorldPanel />
	<TestWorldAside />
</div>
