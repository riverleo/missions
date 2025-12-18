<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Terrain, WorldCharacter, WorldBuilding } from '$lib/types';
	import { setWorldContext } from '$lib/hooks/use-world.svelte';
	import { WorldContext } from './world-context.svelte';
	import type { Camera } from './camera.svelte';
	import WorldRenderer from './world-renderer.svelte';

	interface Props {
		terrain: Terrain;
		characters?: WorldCharacter[];
		buildings?: WorldBuilding[];
		debug?: boolean;
		children?: Snippet;
		oncamerachange?: (camera: Camera) => void;
	}

	let {
		terrain,
		characters = [],
		buildings = [],
		debug = false,
		children,
		oncamerachange,
	}: Props = $props();

	const worldContext = new WorldContext(debug);

	// oncamerachange prop 변경 시 worldContext 업데이트
	$effect(() => {
		worldContext.oncamerachange = oncamerachange;
	});

	// terrain prop 변경 시 worldContext 업데이트 (id 또는 game_asset이 변경되었을 때만)
	let prevTerrainKey = '';
	$effect(() => {
		const key = `${terrain.id}:${terrain.game_asset}`;
		if (key !== prevTerrainKey) {
			prevTerrainKey = key;
			worldContext.terrain = terrain;
		}
	});

	// debug prop 변경 시 worldContext 업데이트
	$effect(() => {
		worldContext.debug = debug;
	});

	setWorldContext(worldContext);
</script>

<WorldRenderer {characters} {buildings}>
	{@render children?.()}
</WorldRenderer>
