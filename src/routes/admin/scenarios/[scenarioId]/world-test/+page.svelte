<script lang="ts">
	import World from '$lib/components/app/world/world.svelte';
	import TestWorldPanel from '$lib/components/admin/test-world/test-world-panel.svelte';
	import TestWorldAside from '$lib/components/admin/test-world/test-world-aside.svelte';
	import TestWorldMarker from '$lib/components/admin/test-world/test-world-marker.svelte';
	import { useTestWorld } from '$lib/hooks/use-test-world';

	const { store } = useTestWorld();
</script>

<div class="relative flex h-full items-center justify-center">
	<div class="h-[400px] w-[800px]">
		<World terrain={$store.selectedTerrain} characters={$store.characters} debug={$store.debug}>
			<TestWorldMarker />
		</World>
	</div>
	<TestWorldPanel />
	<TestWorldAside />
</div>
